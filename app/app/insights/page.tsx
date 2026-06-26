'use client';
import { useState } from 'react';
import { insightsApi } from '@/services/reports';
export default function Page(){const[text,setText]=useState('');const[out,setOut]=useState<unknown>(null);return <><h1>Insights</h1><div className="card"><textarea rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder="Cole o relatório clínico"/><button onClick={()=>insightsApi.preventive(text).then(setOut)}>Preventivo</button><button className="secondary" onClick={()=>insightsApi.clinical(text).then(setOut)}>Avaliação clínica</button></div>{out?<pre className="card">{JSON.stringify(out,null,2)}</pre>:null}</>}
