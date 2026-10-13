const ids = ["prospects","responses","qualified","meetings","held","proposals","clients","ticket","daily","days","weeks","targetRate"];
const $ = id => document.getElementById(id);
const labels = [
  ["Abordados","Empresas que receberam a primeira abordagem","prospects"],
  ["Responderam / interagiram","Respondentes em relação aos abordados","responses"],
  ["Interessados qualificados","Qualificados em relação aos respondentes","qualified"],
  ["Reuniões agendadas","Agendadas em relação aos qualificados","meetings"],
  ["Reuniões realizadas","Realizadas em relação às agendadas","held"],
  ["Propostas enviadas","Propostas em relação às reuniões realizadas","proposals"],
  ["Clientes fechados","Clientes em relação às propostas","clients"]
];
const numeric = id => Math.max(0, Number($(id).value) || 0);
const pct = (n,d) => d > 0 ? (n/d*100).toLocaleString("pt-BR",{maximumFractionDigits:2,minimumFractionDigits:0})+"%" : "—";
const fmt = n => Math.round(n).toLocaleString("pt-BR");
const money = n => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
function render(){
  const v = Object.fromEntries(ids.map(id=>[id,numeric(id)]));
  const warnings=[];
  if(v.responses>v.prospects) warnings.push("Respostas não podem superar o número de prospects abordados.");
  if(v.qualified>v.responses) warnings.push("Interessados qualificados não podem superar as respostas.");
  if(v.meetings>v.qualified) warnings.push("Reuniões agendadas não podem superar os interessados qualificados.");
  if(v.held>v.meetings) warnings.push("Reuniões realizadas não podem superar as reuniões agendadas.");
  if(v.proposals>v.held) warnings.push("Propostas não podem superar as reuniões realizadas.");
  if(v.clients>v.proposals) warnings.push("Clientes fechados não podem superar as propostas enviadas.");
  $("validation").textContent=warnings.join(" ");
  $("kpiProspects").textContent=fmt(v.prospects);
  $("kpiResponse").textContent=pct(v.responses,v.prospects);
  $("kpiClose").textContent=pct(v.clients,v.proposals);
  $("kpiOverall").textContent=pct(v.clients,v.prospects);
  const values=[v.prospects,v.responses,v.qualified,v.meetings,v.held,v.proposals,v.clients];
  const max=Math.max(v.prospects,1);
  $("funnelRows").innerHTML=labels.map((item,i)=>{
    const count=values[i];
    const rate=i===0?100:(values[i-1]>0?count/values[i-1]*100:0);
    return `<div class="funnel-row"><div class="funnel-label">${item[0]}<small>${item[1]}</small></div><div class="track"><div class="fill" style="width:${Math.min(100,count/max*100)}%"></div></div><div class="funnel-count">${fmt(count)}</div><div class="funnel-rate">${i===0?"Base":pct(count,values[i-1])}</div></div>`;
  }).join("");
  const total=v.daily*v.days*v.weeks;
  const estimated=total*v.targetRate/100;
  $("projectProspects").textContent=fmt(total);
  $("projectClients").textContent=estimated.toLocaleString("pt-BR",{maximumFractionDigits:2});
  $("projectRevenue").textContent=money(estimated*v.ticket);
  $("perSale").textContent=v.clients>0&&v.prospects>0? (v.prospects/v.clients).toLocaleString("pt-BR",{maximumFractionDigits:1}) : (v.prospects>0?"Sem vendas": "—");
}
ids.forEach(id=>$(id).addEventListener("input",render));
$("period").addEventListener("input",()=>{});
$("resetBtn").addEventListener("click",()=>{
  if(!confirm("Deseja limpar os dados e restaurar os valores de exemplo?")) return;
  $("period").value="";
  const defaults={prospects:0,responses:0,qualified:0,meetings:0,held:0,proposals:0,clients:0,ticket:1500,daily:20,days:5,weeks:4,targetRate:1};
  Object.entries(defaults).forEach(([id,val])=>$(id).value=val);
  render();
});
$("printBtn").addEventListener("click",()=>window.print());
$("exportBtn").addEventListener("click",()=>{
  const rows=[
    ["Relatório de funil de prospecção",""],
    ["Período",$("period").value||"Não informado"],
    ["Indicador","Valor"],
    ["Prospects abordados",numeric("prospects")],
    ["Responderam / interagiram",numeric("responses")],
    ["Interessados qualificados",numeric("qualified")],
    ["Reuniões agendadas",numeric("meetings")],
    ["Reuniões realizadas",numeric("held")],
    ["Propostas enviadas",numeric("proposals")],
    ["Clientes fechados",numeric("clients")],
    ["Taxa de resposta",pct(numeric("responses"),numeric("prospects"))],
    ["Taxa de fechamento (clientes / propostas)",pct(numeric("clients"),numeric("proposals"))],
    ["Conversão total (clientes / prospects)",pct(numeric("clients"),numeric("prospects"))],
    ["Ticket mensal médio",numeric("ticket")],
    ["Prospects projetados",numeric("daily")*numeric("days")*numeric("weeks")],
    ["Clientes projetados",numeric("daily")*numeric("days")*numeric("weeks")*numeric("targetRate")/100]
  ];
  const csv="\uFEFF"+rows.map(row=>row.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
  const a=document.createElement("a");a.href=url;a.download="relatorio-funil-prospeccao.csv";a.click();URL.revokeObjectURL(url);
});
render();
