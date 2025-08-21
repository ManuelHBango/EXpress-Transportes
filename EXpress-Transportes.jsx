/*
  SITE STARTER — EMPRESA DE TRANSPORTE RODOVIÁRIO
  ------------------------------------------------
  • Stack: React + Tailwind (sem dependências externas), 1 único componente.
  • Interações: busca de rotas, simulação de preço, formulário de reserva com validação,
    armazenamento local (localStorage), FAQ interativo, widget de assistente (mini‑chat),
    geração de link para WhatsApp/Email com o resumo da reserva.
  • Se você estiver no ChatGPT, este arquivo já pode ser pré-visualizado.
  • Para usar no GitHub Pages:
      1) Crie um projeto Vite (React):
         npm create vite@latest transporte-site -- --template react
         cd transporte-site && npm install
      2) Substitua o conteúdo de src/App.jsx por ESTE arquivo (ajuste o export default).
      3) Instale Tailwind e configure (https://tailwindcss.com/docs/guides/vite).
      4) Faça build e publique com GitHub Actions ou gh-pages.

  Personalize rapidamente:
  - Altere COMPANY, CONTACT e ROUTES conforme sua operação.
  - Troque cores e logos nas seções indicadas.
*/

import { useEffect, useMemo, useState } from "react";

// ==========================
// CONFIGURAÇÕES RÁPIDAS
// ==========================
const COMPANY = {
  name: "EXpress Transportes", // mude para o nome oficial
  tagline: "Eficiência & Eficácia em cada viagem",
  primary: "#0ea5e9", // cor principal (Tailwind sky-500 aprox.)
  whatsapp: "+244972578300", // número no formato internacional
  email: "comercialexpresstransportes@gmail.com",
  city: "Luanda, Angola",
  cta: "Reservar agora"
};

const CONTACT = {
  address: " SGT-Rua Brasileira, Luanda",
  phone: "+244 972 578 300",
  email: "comercialexpresstransportes@gmail.com",
  hours: "Seg–Sáb: 06h–20h"
};

// Rotas 
const ROUTES = [
  {
    id: 1,
    origem: "Luanda",
    destino: "Cacuaco",
    distanciaKm: 22,
    horarios: ["06:00", "09:00", "12:00", "15:00", "18:00"],
    precoBase: 1500
  },
  {
    id: 2,
    origem: "Luanda",
    destino: "Cazenga",
    distanciaKm: 12,
    horarios: ["07:00", "10:00", "13:00", "16:00"],
    precoBase: 1200
  },
  {
    id: 3,
    origem: "Luanda",
    destino: "Viana",
    distanciaKm: 25,
    horarios: ["06:30", "09:30", "12:30", "17:00"],
    precoBase: 1800
  },
  {
    id: 4,
    origem: "Luanda",
    destino: "Kilamba",
    distanciaKm: 30,
    horarios: ["06:15", "11:00", "14:30", "18:30"],
    precoBase: 2000
  }
];

// ==========================
// UTILITÁRIOS
// ==========================
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function currency(aoa) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "AOA" }).format(aoa);
  } catch {
    return aoa + " AOA";
  }
}

function buildWhatsAppLink(phone, text) {
  const n = phone.replace(/\D/g, "");
  const urlText = encodeURIComponent(text);
  return `https://wa.me/${n}?text=${urlText}`;
}

function buildMailtoLink(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ==========================
// COMPONENTE PRINCIPAL
// ==========================
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState({ origem: "", destino: "" });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [booking, setBooking] = useState({
    nome: "",
    email: "",
    telefone: "",
    data: "",
    horario: "",
    passageiros: 1
  });
  const [reservas, setReservas] = useState([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantHistory, setAssistantHistory] = useState([
    { role: "bot", text: `Olá! Sou o assistente da ${COMPANY.name}. Como posso ajudar?` }
  ]);

  // Carrega reservas salvas
  useEffect(() => {
    const raw = localStorage.getItem("reservas");
    if (raw) {
      try { setReservas(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reservas", JSON.stringify(reservas));
  }, [reservas]);

  const uniqueOrigins = useMemo(() => [...new Set(ROUTES.map(r => r.origem))], []);
  const uniqueDestinos = useMemo(() => {
    const filtered = ROUTES.filter(r => !search.origem || r.origem === search.origem);
    return [...new Set(filtered.map(r => r.destino))];
  }, [search.origem]);

  const routesFiltered = useMemo(() => {
    return ROUTES.filter(r =>
      (!search.origem || r.origem.toLowerCase().includes(search.origem.toLowerCase())) &&
      (!search.destino || r.destino.toLowerCase().includes(search.destino.toLowerCase()))
    );
  }, [search]);

  const precoEstimado = useMemo(() => {
    if (!selectedRoute) return 0;
    const passageiros = Number(booking.passageiros || 1);
    // Regras simples: preço = base * passageiros; desconto 10% se >= 5 passageiros
    const base = selectedRoute.precoBase * passageiros;
    const desconto = passageiros >= 5 ? base * 0.1 : 0;
    return Math.max(0, Math.round(base - desconto));
  }, [selectedRoute, booking.passageiros]);

  function resetBooking() {
    setSelectedRoute(null);
    setBooking({ nome: "", email: "", telefone: "", data: "", horario: "", passageiros: 1 });
  }

  function submitBooking(e) {
    e.preventDefault();
    if (!selectedRoute) return alert("Escolha uma rota.");

    // Validações simples
    if (!booking.nome || !booking.telefone || !booking.data || !booking.horario)
      return alert("Preencha nome, telefone, data e horário.");

    const nova = {
      id: Date.now(),
      routeId: selectedRoute.id,
      rota: `${selectedRoute.origem} → ${selectedRoute.destino}`,
      ...booking,
      passageiros: Number(booking.passageiros || 1),
      preco: precoEstimado
    };
    setReservas(rs => [nova, ...rs]);
    alert("Reserva registrada localmente! Você pode enviar por WhatsApp ou Email.");
    resetBooking();
  }

  function resumoReserva(r) {
    return [
      `Reserva — ${COMPANY.name}`,
      `Cliente: ${r.nome}`,
      `Contato: ${r.telefone}${r.email ? ` | ${r.email}` : ""}`,
      `Rota: ${r.rota}`,
      `Data/Horário: ${r.data} às ${r.horario}`,
      `Passageiros: ${r.passageiros}`,
      `Preço estimado: ${currency(r.preco)}`,
      "—",
      "Mensagem gerada automaticamente pelo site."
    ].join("\n");
  }

  function assistantSend(userText) {
    if (!userText.trim()) return;
    const lower = userText.toLowerCase();
    const canned = [
      { k: ["horário", "hora", "partida"], a: "Os horários variam por rota. Selecione a rota na seção 'Rotas & Horários' para ver os disponíveis." },
      { k: ["preço", "custo", "valor"], a: "O preço é calculado com base no preço base da rota e no número de passageiros. Veja a simulação no formulário de reserva." },
      { k: ["kilamba", "viana", "cacuaco", "cazenga"], a: "Temos rotas frequentes para esses destinos a partir de Luanda. Confira na lista de rotas." },
      { k: ["contato", "telefone", "email", "whatsapp"], a: `Pode falar conosco por WhatsApp (${COMPANY.whatsapp}) ou email (${COMPANY.email}).` },
      { k: ["bagagem", "mala"], a: "Cada passageiro pode levar 1 mala média e 1 mochila. Itens extras sujeitos a disponibilidade." },
      { k: ["reembolso", "cancelamento"], a: "Cancelamentos até 24h antes têm reembolso integral. Após isso, taxa de 30%." },
    ].find(x => x.k.some(k => lower.includes(k)));

    const answer = canned ? canned.a : "Obrigado! Um atendente entrará em contato em breve. Enquanto isso, consulte rotas e faça a sua reserva.";

    setAssistantHistory(h => [...h, { role: "user", text: userText }, { role: "bot", text: answer }]);
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Banner superior */}
      <TopBar />

      {/* Header / Nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="font-extrabold text-xl tracking-tight" style={{color: COMPANY.primary}}>{COMPANY.name}</div>
              <div className="text-xs text-slate-500">{COMPANY.tagline}</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#rotas" className="hover:text-slate-900">Rotas & Horários</a>
            <a href="#reservar" className="hover:text-slate-900">Reservar</a>
            <a href="#servicos" className="hover:text-slate-900">Serviços</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
            <a href="#contato" className="hover:text-slate-900">Contacto</a>
          </nav>

          <div className="hidden md:block">
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="px-4 py-2 rounded-2xl font-medium shadow-sm border border-slate-200 hover:shadow">
              Ligar
            </a>
            <a href={buildWhatsAppLink(COMPANY.whatsapp, "Olá! Gostaria de informações.")}
               className="ml-2 px-4 py-2 rounded-2xl font-semibold text-white"
               style={{backgroundColor: COMPANY.primary}}>
              {COMPANY.cta}
            </a>
          </div>

          <button className="md:hidden p-2 rounded-lg border" onClick={() => setMenuOpen(v => !v)}>Menu</button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2 border-t">
            {[
              ["#rotas", "Rotas & Horários"],
              ["#reservar", "Reservar"],
              ["#servicos", "Serviços"],
              ["#faq", "FAQ"],
              ["#contato", "Contacto"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="block py-2" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Transporte rodoviário seguro, pontual e confortável.
            </h1>
            <p className="text-slate-600 mb-6">
              Reserve viagens entre bairros e municípios de {COMPANY.city}. Consulte horários, preços
              e emita seu pedido de reserva em minutos.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#reservar" className="px-5 py-3 rounded-2xl font-semibold text-white" style={{backgroundColor: COMPANY.primary}}>Fazer reserva</a>
              <a href="#rotas" className="px-5 py-3 rounded-2xl font-semibold border border-slate-300">Ver rotas</a>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow p-5 border border-slate-200">
            <h3 className="font-semibold mb-3">Pesquisa rápida</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Origem</label>
                <input className="w-full mt-1 p-2 rounded-xl border" list="origens"
                       value={search.origem} onChange={e => setSearch(s => ({...s, origem: e.target.value}))}
                       placeholder="Ex.: Luanda" />
                <datalist id="origens">
                  {uniqueOrigins.map(o => <option key={o} value={o} />)}
                </datalist>
              </div>
              <div>
                <label className="text-sm text-slate-600">Destino</label>
                <input className="w-full mt-1 p-2 rounded-xl border" list="destinos"
                       value={search.destino} onChange={e => setSearch(s => ({...s, destino: e.target.value}))}
                       placeholder="Ex.: Viana" />
                <datalist id="destinos">
                  {uniqueDestinos.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
            </div>
            <div className="mt-4 max-h-56 overflow-auto">
              {routesFiltered.length === 0 && (
                <div className="text-sm text-slate-500">Nenhuma rota encontrada.</div>
              )}
              <ul className="divide-y">
                {routesFiltered.map(r => (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{r.origem} → {r.destino}</div>
                      <div className="text-xs text-slate-500">{r.horarios.join(" · ")}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
                            style={{backgroundColor: COMPANY.primary}}
                            onClick={() => setSelectedRoute(r)}>
                      Selecionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Rotas & Horários */}
      <section id="rotas" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold mb-4">Rotas & Horários</h2>
        <p className="text-slate-600 mb-6">Selecione uma rota para preencher automaticamente no formulário de reserva.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {ROUTES.map(r => (
            <div key={r.id} className="bg-white rounded-3xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{r.origem} → {r.destino}</div>
                  <div className="text-xs text-slate-500">Distância aprox.: {r.distanciaKm} km</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">A partir de</div>
                  <div className="text-base font-bold">{currency(r.precoBase)}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.horarios.map(h => (
                  <span key={h} className="px-2 py-1 rounded-lg text-xs bg-slate-100 border">{h}</span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-2 rounded-xl font-semibold text-white" style={{backgroundColor: COMPANY.primary}}
                        onClick={() => { setSelectedRoute(r); setBooking(b => ({...b, horario: r.horarios[0] || ""})); }}>
                  Escolher esta rota
                </button>
                <a className="px-3 py-2 rounded-xl font-semibold border" href="#reservar">Ir para reserva</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reservas */}
      <section id="reservar" className="bg-white border-t border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold mb-1">Reservar</h2>
          <p className="text-slate-600 mb-6">
            Preencha os dados abaixo. O sistema calcula o preço estimado e gera uma mensagem para WhatsApp ou Email.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Formulário */}
            <form className="md:col-span-2 bg-slate-50 rounded-3xl p-5 border" onSubmit={submitBooking}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Nome completo</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" value={booking.nome}
                         onChange={e => setBooking(b => ({...b, nome: e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Telefone</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" value={booking.telefone}
                         onChange={e => setBooking(b => ({...b, telefone: e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Email (opcional)</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" type="email" value={booking.email}
                         onChange={e => setBooking(b => ({...b, email: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Passageiros</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" type="number" min={1} max={60}
                         value={booking.passageiros}
                         onChange={e => setBooking(b => ({...b, passageiros: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Data</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" type="date" value={booking.data}
                         onChange={e => setBooking(b => ({...b, data: e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Horário</label>
                  <select className="w-full mt-1 p-2 rounded-xl border" value={booking.horario}
                          onChange={e => setBooking(b => ({...b, horario: e.target.value}))} required>
                    <option value="">Selecionar</option>
                    {(selectedRoute?.horarios || []).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Origem</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" value={selectedRoute?.origem || ''}
                         onChange={() => {}} readOnly />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Destino</label>
                  <input className="w-full mt-1 p-2 rounded-xl border" value={selectedRoute?.destino || ''}
                         onChange={() => {}} readOnly />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between bg-white rounded-2xl border p-4">
                <div>
                  <div className="text-sm text-slate-500">Preço estimado</div>
                  <div className="text-2xl font-extrabold">{currency(precoEstimado)}</div>
                </div>
                <button type="submit" className="px-5 py-3 rounded-2xl font-semibold text-white"
                        style={{backgroundColor: COMPANY.primary}}>
                  Confirmar reserva (local)
                </button>
              </div>
            </form>

            {/* Resumo & Envio */}
            <div className="bg-white rounded-3xl border p-5 h-fit">
              <h3 className="font-bold mb-3">Minhas reservas (este dispositivo)</h3>
              {reservas.length === 0 ? (
                <div className="text-sm text-slate-500">Nenhuma reserva ainda.</div>
              ) : (
                <ul className="space-y-3">
                  {reservas.map(r => (
                    <li key={r.id} className="border rounded-2xl p-3">
                      <div className="font-semibold text-sm">{r.rota}</div>
                      <div className="text-xs text-slate-500">{r.data} às {r.horario} — {r.passageiros} pax — {currency(r.preco)}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a className="px-3 py-1.5 rounded-xl text-sm border" href={buildWhatsAppLink(COMPANY.whatsapp, resumoReserva(r))} target="_blank" rel="noreferrer">Enviar WhatsApp</a>
                        <a className="px-3 py-1.5 rounded-xl text-sm border" href={buildMailtoLink(COMPANY.email, `Reserva — ${r.nome}`, resumoReserva(r))}>Enviar Email</a>
                        <button className="px-3 py-1.5 rounded-xl text-sm border" onClick={() => setReservas(rs => rs.filter(x => x.id !== r.id))}>Excluir</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold mb-4">Serviços</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { t: "Transporte Regular", d: "Linhas diárias entre bairros e municípios com horários fixos." },
            { t: "Fretamento", d: "Autocarros para empresas, eventos e grupos com motorista." },
            { t: "Encomendas", d: "Envio de pequenas encomendas entre pontos das nossas rotas." },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-3xl border p-6 shadow-sm">
              <div className="text-lg font-bold mb-1">{s.t}</div>
              <div className="text-slate-600 text-sm">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold mb-4">O que dizem os passageiros</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "Joana M.", t: "Pontualidade impecável e motoristas atenciosos." },
              { n: "Carlos A.", t: "Reservei em minutos e tudo correu perfeito." },
              { n: "Ana P.", t: "Veículos limpos e confortáveis, recomendo!" },
            ].map((d, i) => (
              <div key={i} className="bg-white rounded-3xl border p-6 shadow-sm">
                <div className="text-sm text-slate-600">“{d.t}”</div>
                <div className="mt-3 text-xs font-semibold">{d.n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold mb-4">Perguntas frequentes</h2>
        <Accordion
          items={[
            { q: "Como alterar ou cancelar uma reserva?", a: "Fale com o nosso atendimento por WhatsApp com pelo menos 24h de antecedência." },
            { q: "É possível levar bagagem extra?", a: "Sim, mediante disponibilidade e possível taxa adicional." },
            { q: "Posso reservar para grupo grande?", a: "Claro! Para 10+ passageiros sugerimos solicitar fretamento." },
          ]}
        />
      </section>

      {/* Contato */}
      <section id="contato" className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-extrabold mb-3">Contacto</h2>
            <ul className="space-y-2 text-slate-700">
              <li><b>Endereço:</b> {CONTACT.address}</li>
              <li><b>Telefone:</b> {CONTACT.phone}</li>
              <li><b>Email:</b> {CONTACT.email}</li>
              <li><b>Horário:</b> {CONTACT.hours}</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <a className="px-4 py-2 rounded-2xl font-semibold border" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>Ligar</a>
              <a className="px-4 py-2 rounded-2xl font-semibold text-white" style={{backgroundColor: COMPANY.primary}}
                 href={buildWhatsAppLink(COMPANY.whatsapp, "Olá! Gostaria de informações sobre rotas.")}>Falar no WhatsApp</a>
            </div>
          </div>
          <div className="bg-slate-50 rounded-3xl border p-5">
            <h3 className="font-bold mb-2">Mapa (ilustrativo)</h3>
            <div className="h-64 rounded-2xl border bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]"></div>
            <p className="text-xs text-slate-500 mt-2">Substitua por um mapa incorporado (Google Maps/OSM) quando tiver as coordenadas.</p>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm">© {new Date().getFullYear()} {COMPANY.name}. Todos os direitos reservados.</div>
          <div className="text-xs text-slate-500">Feito com ♥ — Starter React/Tailwind</div>
        </div>
      </footer>

      {/* Assistente flutuante */}
      <AssistantWidget open={showAssistant} onToggle={() => setShowAssistant(v => !v)} history={assistantHistory} onSend={assistantSend} />
    </div>
  );
}

// ==========================
// SUBCOMPONENTES
// ==========================
function TopBar() {
  return (
    <div className="w-full bg-slate-900 text-white text-xs">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
        <div>🚌 Promo: grupos de 5+ têm 10% de desconto</div>
        <div className="hidden sm:block">Segurança, conforto e pontualidade</div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm" aria-label="Logo">
      <span role="img" aria-label="bus">🚌</span>
    </div>
  );
}

function Accordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y rounded-3xl border bg-white">
      {items.map((it, idx) => (
        <div key={idx}>
          <button className="w-full text-left px-4 py-3 font-semibold flex items-center justify-between" onClick={() => setOpen(o => (o === idx ? -1 : idx))}>
            <span>{it.q}</span>
            <span className="text-slate-400">{open === idx ? "−" : "+"}</span>
          </button>
          {open === idx && (
            <div className="px-4 pb-4 text-slate-600 text-sm">{it.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AssistantWidget({ open, onToggle, history, onSend }) {
  const [text, setText] = useState("");

  return (
    <div>
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 px-4 py-3 rounded-2xl font-semibold text-white shadow-lg"
        style={{backgroundColor: "#0ea5e9"}}
      >
        {open ? "Fechar" : "Ajuda"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 w-80 bg-white rounded-3xl border shadow-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 font-bold bg-slate-50 border-b">Assistente</div>
          <div className="p-3 h-64 overflow-auto space-y-2 text-sm">
            {history.map((m, i) => (
              <div key={i} className={classNames("px-3 py-2 rounded-2xl max-w-[85%]", m.role === "bot" ? "bg-slate-100" : "bg-[var(--bubble,#e0f2fe)] ml-auto")}
                   style={m.role === "user" ? {"--bubble": "#e0f2fe"} : {}}>
                {m.text}
              </div>
            ))}
          </div>
          <form className="p-3 border-t flex gap-2" onSubmit={(e) => { e.preventDefault(); onSend(text); setText(""); }}>
            <input className="flex-1 p-2 rounded-xl border" placeholder="Escreva sua pergunta..." value={text} onChange={e => setText(e.target.value)} />
            <button className="px-3 py-2 rounded-xl font-semibold text-white" style={{backgroundColor: "#0ea5e9"}}>Enviar</button>
          </form>
          <div className="px-3 pb-3 text-[11px] text-slate-500">Respostas automáticas. Para dúvidas específicas, use o WhatsApp.</div>
        </div>
      )}
    </div>
  );
}
