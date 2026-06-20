import { notFound } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { getPatient } from "@/services/patients";
import { getReports } from "@/services/symptoms";
import { generateAiReport } from "@/services/reports";
export default async function PatientDetail({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const user = await getCurrentUser("professional");
  if (!user) notFound();
  const patient = await getPatient(user, patientId);
  if (!patient) notFound();
  const reports = await getReports(user, patientId);
  const ai = await generateAiReport(
    user,
    patientId,
    reports.map((report) => report.symptom_description).join("; "),
  );
  return (
    <main>
      <div className="nav">
        <a href="/professional/patients">← Pacientes</a>
        <span className="badge">Prontuário vinculado</span>
      </div>
      <h1>{patient.name}</h1>
      <section className="grid">
        <div className="card">
          <p className="muted">Idade</p>
          <div className="metric">{"age" in patient ? patient.age : "-"}</div>
        </div>
        <div className="card">
          <p className="muted">Risco</p>
          <div className={`metric risk-${ai.risk}`}>{ai.risk}</div>
        </div>
        <div className="card">
          <p className="muted">Check-ins</p>
          <div className="metric">{reports.length}</div>
        </div>
      </section>
      <article className="card">
        <h2>Relatório IA</h2>
        <p>{ai.summary}</p>
        <ul>
          {ai.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
      <h2>Histórico recente</h2>
      {reports.map((report) => (
        <article className="card" key={report.id}>
          <strong>{report.report_date}</strong>
          <p>{report.symptom_description}</p>
          <p className="muted">
            Alertas: {report.riskFlags.join(", ") || "nenhum"}
          </p>
        </article>
      ))}
    </main>
  );
}
