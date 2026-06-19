import { redirect } from "next/navigation";
import { USE_MOCK } from "@/services/api";
export default function Callback() {
  if (USE_MOCK) redirect("/patient/dashboard");
  return (
    <main>
      <h1>Finalizando autenticação</h1>
      <p className="muted">
        O backend FastAPI concluirá a troca do código OIDC por uma sessão
        HttpOnly segura.
      </p>
    </main>
  );
}
