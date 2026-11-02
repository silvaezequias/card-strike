"use client";

import { FormEvent, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { api } from "@/lib/online/api";
import { useOnline } from "@/lib/online/online-context";
import { loginWithSteam, steam } from "@/lib/platform/steam";
import {
  Avatar,
  FieldError,
  Panel,
  STATUS_LABEL,
  ghostButton,
  inputClass,
  primaryButton,
} from "./ui";

/* Conta: entrar como convidado (só nick), com Google/Discord, ou ver o perfil. */

const IS_DEV = process.env.NODE_ENV !== "production";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"
    />
  </svg>
);

const DiscordMark = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="6" fill="#5865F2" />
    <circle cx="9" cy="12" r="1.8" fill="#fff" />
    <circle cx="15" cy="12" r="1.8" fill="#fff" />
  </svg>
);

const ProviderButton = ({
  provider,
  label,
  enabled,
}: {
  provider: "google" | "discord";
  label: string;
  enabled: boolean;
}) =>
  enabled ? (
    <a href={`/api/auth/${provider}?next=/`} className={ghostButton}>
      {provider === "google" ? <GoogleMark /> : <DiscordMark />}
      {label}
    </a>
  ) : (
    <span
      className={`${ghostButton} cursor-not-allowed opacity-40`}
      title="Ainda não configurado neste servidor"
    >
      {provider === "google" ? <GoogleMark /> : <DiscordMark />}
      {label}
    </span>
  );

export const AccountPanel = ({ onClose }: { onClose: () => void }) => {
  const { available, providers, me, refreshMe, logout } = useOnline();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refreshMe();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitGuest = (e: FormEvent) => {
    e.preventDefault();
    run(() => api.guest(name));
  };

  if (!available) {
    return (
      <Panel title="Online" kicker="CARD STRIKE" onClose={onClose}>
        <p className="text-sm text-zinc-300">
          O modo online ainda não está configurado neste servidor. As partidas
          locais continuam funcionando.
        </p>
      </Panel>
    );
  }

  if (me) {
    return (
      <Panel
        title="Sua conta"
        kicker={me.kind === "guest" ? "CONVIDADO" : "CONTA"}
        onClose={onClose}
      >
        <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/40 p-3">
          <Avatar user={me} size={48} />
          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-wider">
              {me.handle}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-zinc-400">
              {STATUS_LABEL[me.status] ?? "Online"}
            </p>
          </div>
        </div>

        {me.kind === "guest" ? (
          <section className="flex flex-col gap-2">
            <p className="text-xs text-zinc-300">
              Convidados jogam normalmente, mas não têm lista de amigos. Crie
              uma conta para adicionar amigos e receber convites.
            </p>
            <ProviderButton
              provider="google"
              label="Criar conta com Google"
              enabled={providers.google}
            />
            <ProviderButton
              provider="discord"
              label="Criar conta com Discord"
              enabled={providers.discord}
            />
          </section>
        ) : (
          <section className="flex flex-col gap-2">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => api.rename(name));
              }}
            >
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Novo nome"
                maxLength={16}
              />
              <button
                className={ghostButton}
                disabled={busy || name.trim().length < 3}
              >
                Trocar
              </button>
            </form>
            <p className="text-[11px] text-zinc-500">
              Trocar o nome gera um novo #número. Seus amigos continuam com
              você.
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.3em] text-zinc-400">
              LIGAR OUTROS LOGINS
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ProviderButton
                provider="google"
                label="Google"
                enabled={providers.google}
              />
              <ProviderButton
                provider="discord"
                label="Discord"
                enabled={providers.discord}
              />
            </div>
          </section>
        )}

        <FieldError message={error} />
        <button
          className={ghostButton}
          onClick={async () => {
            await logout();
            onClose();
          }}
        >
          <LogOut size={14} />
          Sair da conta
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Entrar" kicker="JOGAR ONLINE" onClose={onClose}>
      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-400">
          COM CONTA (TEM LISTA DE AMIGOS)
        </p>
        {steam() && (
          <button
            className={primaryButton}
            disabled={busy}
            onClick={() => run(loginWithSteam)}
          >
            Entrar com a Steam
          </button>
        )}
        <ProviderButton
          provider="google"
          label="Entrar com Google"
          enabled={providers.google}
        />
        <ProviderButton
          provider="discord"
          label="Entrar com Discord"
          enabled={providers.discord}
        />
        {!providers.google && !providers.discord && (
          <p className="text-[11px] text-zinc-500">
            Os logins do Google e do Discord ainda não foram configurados neste
            servidor.
          </p>
        )}
      </section>

      <form className="flex flex-col gap-2" onSubmit={submitGuest}>
        <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-400">
          OU SÓ COM UM NICK (CONVIDADO)
        </p>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nick"
          maxLength={16}
          autoFocus
        />
        <button
          className={primaryButton}
          disabled={busy || name.trim().length < 3}
        >
          <UserIcon size={14} />
          Jogar como convidado
        </button>
      </form>

      {IS_DEV && (
        <button
          className={ghostButton}
          disabled={busy || name.trim().length < 3}
          onClick={() => run(() => api.devLogin(name))}
        >
          Conta de teste (só no desenvolvimento)
        </button>
      )}
      <FieldError message={error} />
    </Panel>
  );
};
