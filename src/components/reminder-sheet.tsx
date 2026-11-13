"use client";

import { useState, useTransition } from "react";
import { urlBase64ToUint8Array } from "@/lib/push";
import {
  removePushSubscription,
  saveReminder,
  savePushSubscription,
  sendTestReminder,
} from "@/server/actions/reminders";
import { Button, Field, Sheet, inputClass } from "./ui";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DEFAULT_TIME = "08:00";

export function ReminderSheet({
  open,
  reminderTime,
  onClose,
}: {
  open: boolean;
  /** The time already saved ("HH:MM"), or null when there is no reminder. */
  reminderTime: string | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label="Lembrete da rotina">
      <ReminderForm reminderTime={reminderTime} onDone={onClose} />
    </Sheet>
  );
}

/** Wait for the service worker, but not forever: if it never registered, say so instead of hanging. */
function readyWorker(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
  ]);
}

function ReminderForm({ reminderTime, onDone }: { reminderTime: string | null; onDone: () => void }) {
  // This sheet only exists in the browser (a closed sheet renders nothing), so these can be read directly.
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [permission, setPermission] = useState<NotificationPermission>(supported ? Notification.permission : "default");
  const [deviceOn, setDeviceOn] = useState<boolean | null>(supported ? null : false);
  const [time, setTime] = useState(reminderTime ?? DEFAULT_TIME);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  // Is this device already registered? Asked once; until it answers the buttons wait.
  const [asked, setAsked] = useState(false);
  if (supported && !asked) {
    setAsked(true);
    readyWorker()
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setDeviceOn(sub !== null))
      .catch(() => setDeviceOn(false));
  }

  const active = reminderTime !== null && deviceOn === true;
  const blocked = permission === "denied";
  const tell = (text: string, bad = false) => setMessage({ text, bad });

  function enable() {
    setMessage(null);
    startTransition(async () => {
      try {
        const answer = await Notification.requestPermission();
        setPermission(answer);
        if (answer !== "granted") return tell("Sem a permissão do navegador não dá para avisar. Você pode tentar de novo.", true);
        const reg = await readyWorker();
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY!) }));
        const json = sub.toJSON();
        const saved = await savePushSubscription({
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
        });
        if (!saved.ok) return tell(saved.error, true);
        const result = await saveReminder(time);
        if (!result.ok) return tell(result.error, true);
        setDeviceOn(true);
        tell(`Pronto. Você será avisado às ${time}, se ainda houver hábitos de hoje sem marcar.`);
      } catch {
        tell("Não foi possível preparar as notificações neste aparelho. Tente de novo em instantes.", true);
      }
    });
  }

  function saveTime() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveReminder(time);
      if (!result.ok) return tell(result.error, true);
      tell(`Horário salvo: ${time}.`);
    });
  }

  function disable() {
    setMessage(null);
    startTransition(async () => {
      try {
        const reg = await readyWorker();
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
      } catch {
        // nothing to undo on this device; the reminder is still turned off below
      }
      await saveReminder(null);
      setDeviceOn(false);
      tell("Lembrete desligado.");
    });
  }

  function test() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendTestReminder();
      tell(result.ok ? "Enviado. A notificação deve aparecer em alguns segundos." : result.error, !result.ok);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lembrete da rotina</h2>
        <button type="button" onClick={onDone} className="-m-2.5 p-2.5 text-[13px] text-muted hover:text-ink">
          Fechar
        </button>
      </div>

      <p className="text-[13px] leading-relaxed text-muted">
        Um aviso no horário que você escolher, só se ainda houver hábitos de hoje sem marcar. Se a rotina já estiver em
        dia, nada é enviado.
      </p>

      {!PUBLIC_KEY ? (
        <p role="status" className="rounded-[14px] bg-soft p-3.5 text-[13px] leading-relaxed">
          Os lembretes ainda não foram configurados neste servidor.
        </p>
      ) : !supported ? (
        <p role="status" className="rounded-[14px] bg-soft p-3.5 text-[13px] leading-relaxed">
          Este navegador não permite lembretes. No Android, use o Chrome, de preferência com o Aura instalado na tela
          inicial.
        </p>
      ) : (
        <>
          {blocked && (
            <p role="status" className="rounded-[14px] bg-miss-bg p-3.5 text-[13px] leading-relaxed">
              As notificações estão bloqueadas para o Aura neste aparelho. Libere nas configurações do site (o cadeado
              ao lado do endereço) e volte aqui.
            </p>
          )}
          <Field label="Horário" hint="No fuso horário da sua conta.">
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </Field>
          {reminderTime !== null && deviceOn === false && (
            <p className="text-xs text-muted">Há um lembrete em {reminderTime}, mas este aparelho ainda não recebe.</p>
          )}
          <Button
            size="lg"
            disabled={pending || blocked || deviceOn === null || !time}
            onClick={active ? saveTime : enable}
          >
            {active ? "Salvar horário" : reminderTime !== null ? "Ativar neste aparelho" : "Ativar lembrete"}
          </Button>
          {active && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <button
                type="button"
                disabled={pending}
                onClick={test}
                className="-my-2 py-2 text-[13px] underline underline-offset-[3px] disabled:opacity-50"
              >
                Enviar um teste
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={disable}
                className="-my-2 py-2 text-[13px] text-muted underline underline-offset-[3px] hover:text-ink disabled:opacity-50"
              >
                Desativar lembrete
              </button>
            </div>
          )}
        </>
      )}

      {message && (
        <p role="status" className={message.bad ? "animate-rise text-[13px] text-miss" : "animate-rise text-[13px]"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
