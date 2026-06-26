"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { MonitoringPlan } from "@/lib/types";
import { monitoringApi } from "@/services/monitoring";

export default function Page() {
  const params = useParams();

  const id = Number(params?.id);

  const [plans, setPlans] = useState<MonitoringPlan[]>([]);

  async function load() {
    try {
      const data = await monitoringApi.listPatientPlans(id);
      setPlans(data);
    } catch (err) {
      setPlans([]);
    }
  }

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    load();
  }, [id]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    const name = String(f.get("name") || "").trim();
    if (!name) return;

    try {
      await monitoringApi.createPlan({
        patient_id: id,
        name,
        active: true,
      });

      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      console.error("Erro ao criar plano:", err);
    }
  }

  if (!id || Number.isNaN(id)) {
    return (
      <>
        <h1>ID inválido</h1>
      </>
    );
  }

  return (
    <>
      <h1>Monitoramento #{id}</h1>

      <form className="card" onSubmit={submit}>
        <label>
          Nome do plano
          <input name="name" required />
        </label>

        <button type="submit">Criar plano</button>
      </form>

      {plans.length === 0 ? (
        <p>Nenhum plano encontrado.</p>
      ) : (
        plans.map((p) => (
          <article className="card" key={p.id}>
            {p.name ?? `Plano #${p.id}`}
          </article>
        ))
      )}
    </>
  );
}