import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Clipboard,
  Copy,
  Film,
  Mail,
  MessageSquareText,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import './index.css'

const STORAGE_KEY = 'bani-entregas-state'
const assetBase = import.meta.env.BASE_URL

const defaultFields = {
  client: 'Cliente',
  project: 'Proyecto',
  piece: 'Video principal',
  status: 'en proceso de postproduccion',
  deliveryDate: 'viernes',
  reviewRound: 'primera vuelta',
  link: '',
  nextStep: 'Nos avisan cualquier ajuste y avanzamos con la siguiente version.',
  notes: 'Estamos cuidando ritmo, color y terminacion general.',
  sender: 'Equipo BANI',
}

const defaultTemplates = [
  {
    id: 'estado-video',
    title: 'Estado de video',
    category: 'Seguimiento',
    channel: 'WhatsApp',
    tone: 'Claro y profesional',
    body:
      'Hola {client}, como estas?\n\nTe compartimos el estado de {piece} para {project}: actualmente esta {status}.\n\nLa entrega estimada para esta instancia es {deliveryDate}. {notes}\n\n{nextStep}\n\nGracias!\n{sender}',
  },
  {
    id: 'envio-review',
    title: 'Envio para revision',
    category: 'Entrega',
    channel: 'Mail / WhatsApp',
    tone: 'Ordenado',
    body:
      'Hola {client}, como estas?\n\nYa dejamos lista la {reviewRound} de {piece} para {project}.\n\nLink de revision: {link}\n\nCuando puedan, pasennos comentarios consolidados sobre este link asi mantenemos una sola linea de feedback.\n\nGracias!\n{sender}',
  },
  {
    id: 'faltan-materiales',
    title: 'Faltan materiales',
    category: 'Produccion',
    channel: 'WhatsApp',
    tone: 'Directo',
    body:
      'Hola {client}, como estas?\n\nPara poder avanzar con {piece} de {project}, nos falta recibir materiales o definiciones pendientes.\n\nPendiente principal: {notes}\n\nApenas lo tengamos, retomamos y actualizamos fecha de entrega.\n\nGracias!\n{sender}',
  },
  {
    id: 'demora-cuidada',
    title: 'Ajuste de fecha',
    category: 'Seguimiento',
    channel: 'Mail / WhatsApp',
    tone: 'Cuidado',
    body:
      'Hola {client}, como estas?\n\nQueremos avisarles que {piece} para {project} necesita un poco mas de trabajo para llegar con la terminacion que buscamos.\n\nNuevo estimado de entrega: {deliveryDate}.\n\n{notes}\n\nGracias por la paciencia.\n{sender}',
  },
  {
    id: 'entrega-final',
    title: 'Entrega final',
    category: 'Cierre',
    channel: 'Mail',
    tone: 'Formal',
    body:
      'Hola {client}, como estas?\n\nLes compartimos la entrega final de {piece} para {project}.\n\nLink: {link}\n\nQuedamos atentos por cualquier cosa que necesiten para cerrar el proceso.\n\nGracias!\n{sender}',
  },
]

const statuses = [
  'en proceso de postproduccion',
  'en edicion offline',
  'en color',
  'en sonido',
  'en VFX',
  'en revision interna',
  'listo para revision del cliente',
  'aprobado y preparando masters',
]

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return null
    return {
      fields: { ...defaultFields, ...saved.fields },
      templates: saved.templates?.length ? saved.templates : defaultTemplates,
      selectedId: saved.selectedId || defaultTemplates[0].id,
      history: saved.history || [],
    }
  } catch {
    return null
  }
}

function fillTemplate(template, fields) {
  return template.replace(/\{(\w+)\}/g, (_, key) => fields[key] || '')
}

function App() {
  const saved = loadState()
  const [fields, setFields] = useState(saved?.fields || defaultFields)
  const [templates, setTemplates] = useState(saved?.templates || defaultTemplates)
  const [selectedId, setSelectedId] = useState(saved?.selectedId || defaultTemplates[0].id)
  const [history, setHistory] = useState(saved?.history || [])
  const [copied, setCopied] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(false)

  const selectedTemplate = templates.find((template) => template.id === selectedId) || templates[0]
  const message = useMemo(() => fillTemplate(selectedTemplate.body, fields), [selectedTemplate, fields])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fields, templates, selectedId, history }))
  }, [fields, templates, selectedId, history])

  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }))

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setHistory((items) => [
      {
        id: crypto.randomUUID(),
        template: selectedTemplate.title,
        client: fields.client,
        project: fields.project,
        copiedAt: new Date().toISOString(),
      },
      ...items,
    ].slice(0, 8))
    window.setTimeout(() => setCopied(false), 1600)
  }

  const addTemplate = () => {
    const fresh = {
      id: crypto.randomUUID(),
      title: 'Nuevo mensaje',
      category: 'Personalizado',
      channel: 'WhatsApp',
      tone: 'Neutro',
      body: 'Hola {client}, como estas?\n\nTe escribimos por {project}.\n\n{nextStep}\n\nGracias!\n{sender}',
    }
    setTemplates((items) => [fresh, ...items])
    setSelectedId(fresh.id)
    setEditingTemplate(true)
  }

  const updateTemplate = (patch) => {
    setTemplates((items) => items.map((template) => (
      template.id === selectedTemplate.id ? { ...template, ...patch } : template
    )))
  }

  const deleteTemplate = () => {
    if (templates.length === 1) return
    const nextTemplates = templates.filter((template) => template.id !== selectedTemplate.id)
    setTemplates(nextTemplates)
    setSelectedId(nextTemplates[0].id)
  }

  const resetAll = () => {
    setFields(defaultFields)
    setTemplates(defaultTemplates)
    setSelectedId(defaultTemplates[0].id)
    setHistory([])
    setEditingTemplate(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img src={`${assetBase}logo.png`} alt="BANI VFX" />
          <div>
            <strong>ENTREGAS</strong>
            <span>Mensajes de post</span>
          </div>
        </div>

        <nav>
          {templates.map((template) => (
            <button
              key={template.id}
              className={template.id === selectedId ? 'active' : ''}
              onClick={() => setSelectedId(template.id)}
            >
              <MessageSquareText size={16} />
              {template.title}
            </button>
          ))}
        </nav>

        <div className="side-total">
          <span>Mensaje activo</span>
          <strong>{selectedTemplate.category}</strong>
          <small>{selectedTemplate.channel} · {selectedTemplate.tone}</small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">BANI VFX · Postproduccion</p>
            <h1>Mensajes diarios para clientes</h1>
          </div>
          <div className="toolbar">
            <button className="ghost" onClick={addTemplate}><Plus size={16} /> Nuevo</button>
            <button className="ghost" onClick={resetAll}><RotateCcw size={16} /> Reset</button>
            <button className="primary" onClick={copyMessage}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </header>

        <section className="workspace-grid">
          <div className="panel composer-panel">
            <SectionTitle icon={<Film />} eyebrow="Variables" title="Datos del envio" />
            <div className="form-grid">
              <Input label="Cliente" value={fields.client} onChange={(value) => updateField('client', value)} />
              <Input label="Proyecto" value={fields.project} onChange={(value) => updateField('project', value)} />
              <Input label="Pieza / video" value={fields.piece} onChange={(value) => updateField('piece', value)} />
              <Select label="Estado" value={fields.status} options={statuses} onChange={(value) => updateField('status', value)} />
              <Input label="Fecha estimada" value={fields.deliveryDate} onChange={(value) => updateField('deliveryDate', value)} />
              <Input label="Vuelta" value={fields.reviewRound} onChange={(value) => updateField('reviewRound', value)} />
              <Input label="Link" value={fields.link} onChange={(value) => updateField('link', value)} />
              <Input label="Firma" value={fields.sender} onChange={(value) => updateField('sender', value)} />
            </div>
            <div className="two-col">
              <Textarea label="Notas internas para el cliente" value={fields.notes} onChange={(value) => updateField('notes', value)} />
              <Textarea label="Proximo paso" value={fields.nextStep} onChange={(value) => updateField('nextStep', value)} />
            </div>
          </div>

          <div className="panel preview-panel">
            <SectionTitle icon={<Send />} eyebrow="Preview" title={selectedTemplate.title} />
            <div className="message-preview">{message}</div>
            <div className="quick-actions">
              <a className="ghost" href={`mailto:?subject=${encodeURIComponent(`${fields.project} · ${fields.piece}`)}&body=${encodeURIComponent(message)}`}>
                <Mail size={16} /> Mail
              </a>
              <a className="ghost" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
                <Clipboard size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="lower-grid">
          <div className="panel template-editor">
            <div className="dashboard-heading">
              <SectionTitle icon={<Sparkles />} eyebrow="Plantilla" title="Texto preestablecido" />
              <div className="toolbar">
                <button className="ghost" onClick={() => setEditingTemplate((value) => !value)}>
                  <Save size={16} /> {editingTemplate ? 'Cerrar' : 'Editar'}
                </button>
                <button className="icon-button" title="Eliminar plantilla" onClick={deleteTemplate} disabled={templates.length === 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {editingTemplate ? (
              <div className="template-form">
                <div className="form-grid compact">
                  <Input label="Titulo" value={selectedTemplate.title} onChange={(value) => updateTemplate({ title: value })} />
                  <Input label="Categoria" value={selectedTemplate.category} onChange={(value) => updateTemplate({ category: value })} />
                  <Input label="Canal" value={selectedTemplate.channel} onChange={(value) => updateTemplate({ channel: value })} />
                  <Input label="Tono" value={selectedTemplate.tone} onChange={(value) => updateTemplate({ tone: value })} />
                </div>
                <Textarea label="Cuerpo del mensaje" value={selectedTemplate.body} onChange={(value) => updateTemplate({ body: value })} />
                <p className="token-help">Variables: {'{client}'} {'{project}'} {'{piece}'} {'{status}'} {'{deliveryDate}'} {'{reviewRound}'} {'{link}'} {'{notes}'} {'{nextStep}'} {'{sender}'}</p>
              </div>
            ) : (
              <div className="template-readonly">{selectedTemplate.body}</div>
            )}
          </div>

          <div className="panel history-panel">
            <SectionTitle icon={<Clipboard />} eyebrow="Registro local" title="Ultimos copiados" />
            <div className="history-list">
              {history.length ? history.map((item) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.template}</strong>
                  <span>{item.client} · {item.project}</span>
                  <small>{new Date(item.copiedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</small>
                </div>
              )) : (
                <div className="empty-state">
                  <strong>Sin envios copiados</strong>
                  <p>Cuando copies un mensaje, queda aca como referencia rapida.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionTitle({ icon, eyebrow, title }) {
  return (
    <div className="section-title">
      <div className="title-icon">{icon}</div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export default App
