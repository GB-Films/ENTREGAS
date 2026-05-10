import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Clipboard,
  Cloud,
  CloudOff,
  Copy,
  Film,
  Languages,
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
import {
  isCloudStorageEnabled,
  loadLocalState,
  loadSharedState,
  saveLocalState,
  saveSharedState,
} from './lib/storage'

const assetBase = import.meta.env.BASE_URL

const copy = {
  es: {
    appSubtitle: 'Mensajes de post',
    activeMessage: 'Mensaje activo',
    brandLine: 'BANI VFX - Postproduccion',
    heading: 'Mensajes diarios para clientes',
    new: 'Nuevo',
    reset: 'Reset',
    copied: 'Copiado',
    copy: 'Copiar',
    variables: 'Variables',
    sendData: 'Datos del envio',
    client: 'Cliente',
    project: 'Proyecto',
    piece: 'Pieza / video',
    status: 'Estado',
    deliveryDate: 'Fecha estimada',
    reviewRound: 'Vuelta',
    link: 'Link',
    sender: 'Firma',
    notes: 'Notas internas para el cliente',
    nextStep: 'Proximo paso',
    preview: 'Preview',
    template: 'Plantilla',
    templateText: 'Texto preestablecido',
    close: 'Cerrar',
    edit: 'Editar',
    title: 'Titulo',
    category: 'Categoria',
    channel: 'Canal',
    tone: 'Tono',
    body: 'Cuerpo del mensaje',
    tokens: 'Variables',
    sharedRecord: 'Registro compartido',
    latestCopied: 'Ultimos copiados',
    emptyTitle: 'Sin envios copiados',
    emptyBody: 'Cuando copies un mensaje, queda aca como referencia rapida para todo el equipo.',
    language: 'Idioma',
    messageLanguage: 'Idioma del mensaje',
    spanish: 'Castellano',
    english: 'Ingles',
    cloudReady: 'Nube sincronizada',
    cloudSaving: 'Guardando en nube...',
    cloudOff: 'Modo local',
    cloudError: 'Sin conexion a nube',
    cloudLoading: 'Conectando nube...',
  },
  en: {
    appSubtitle: 'Post messages',
    activeMessage: 'Active message',
    brandLine: 'BANI VFX - Postproduction',
    heading: 'Daily client messages',
    new: 'New',
    reset: 'Reset',
    copied: 'Copied',
    copy: 'Copy',
    variables: 'Variables',
    sendData: 'Send details',
    client: 'Client',
    project: 'Project',
    piece: 'Piece / video',
    status: 'Status',
    deliveryDate: 'Estimated date',
    reviewRound: 'Round',
    link: 'Link',
    sender: 'Signature',
    notes: 'Client-facing notes',
    nextStep: 'Next step',
    preview: 'Preview',
    template: 'Template',
    templateText: 'Preset text',
    close: 'Close',
    edit: 'Edit',
    title: 'Title',
    category: 'Category',
    channel: 'Channel',
    tone: 'Tone',
    body: 'Message body',
    tokens: 'Variables',
    sharedRecord: 'Shared log',
    latestCopied: 'Latest copied',
    emptyTitle: 'No copied messages',
    emptyBody: 'When you copy a message, it appears here as a quick team reference.',
    language: 'Language',
    messageLanguage: 'Language',
    spanish: 'Spanish',
    english: 'English',
    cloudReady: 'Cloud synced',
    cloudSaving: 'Saving to cloud...',
    cloudOff: 'Local mode',
    cloudError: 'Cloud unavailable',
    cloudLoading: 'Connecting cloud...',
  },
}

const defaultFieldsByLanguage = {
  es: {
    client: 'Cliente',
    project: 'Proyecto',
    piece: 'Video principal',
    statusKey: 'post',
    deliveryDate: 'viernes',
    reviewRound: 'primera vuelta',
    link: '',
    nextStep: 'Nos avisan cualquier ajuste y avanzamos con la siguiente version.',
    notes: 'Estamos cuidando ritmo, color y terminacion general.',
    sender: 'Equipo BANI',
  },
  en: {
    client: 'Client',
    project: 'Project',
    piece: 'Main video',
    statusKey: 'post',
    deliveryDate: 'Friday',
    reviewRound: 'first round',
    link: '',
    nextStep: 'Send us any adjustments and we will move forward with the next version.',
    notes: 'We are refining rhythm, color and the overall finish.',
    sender: 'BANI Team',
  },
}

const defaultFields = defaultFieldsByLanguage.es

const statuses = [
  { key: 'post', es: 'en proceso de postproduccion', en: 'in postproduction' },
  { key: 'offline', es: 'en edicion offline', en: 'in offline edit' },
  { key: 'color', es: 'en color', en: 'in color' },
  { key: 'sound', es: 'en sonido', en: 'in sound' },
  { key: 'vfx', es: 'en VFX', en: 'in VFX' },
  { key: 'internal', es: 'en revision interna', en: 'in internal review' },
  { key: 'client-review', es: 'listo para revision del cliente', en: 'ready for client review' },
  { key: 'masters', es: 'aprobado y preparando masters', en: 'approved and preparing masters' },
]

const defaultTemplates = [
  {
    id: 'estado-video',
    title: { es: 'Estado de video', en: 'Video status' },
    category: { es: 'Seguimiento', en: 'Follow-up' },
    channel: 'WhatsApp',
    tone: { es: 'Claro y profesional', en: 'Clear and professional' },
    body: {
      es: 'Hola {client}, como estas?\n\nTe compartimos el estado de {piece} para {project}: actualmente esta {status}.\n\nLa entrega estimada para esta instancia es {deliveryDate}. {notes}\n\n{nextStep}\n\nGracias!\n{sender}',
      en: 'Hi {client}, how are you?\n\nSharing the status of {piece} for {project}: it is currently {status}.\n\nThe estimated delivery for this stage is {deliveryDate}. {notes}\n\n{nextStep}\n\nThanks!\n{sender}',
    },
  },
  {
    id: 'envio-review',
    title: { es: 'Envio para revision', en: 'Review delivery' },
    category: { es: 'Entrega', en: 'Delivery' },
    channel: 'Mail / WhatsApp',
    tone: { es: 'Ordenado', en: 'Organized' },
    body: {
      es: 'Hola {client}, como estas?\n\nYa dejamos lista la {reviewRound} de {piece} para {project}.\n\nLink de revision: {link}\n\nCuando puedan, pasennos comentarios consolidados sobre este link asi mantenemos una sola linea de feedback.\n\nGracias!\n{sender}',
      en: 'Hi {client}, how are you?\n\nThe {reviewRound} of {piece} for {project} is ready.\n\nReview link: {link}\n\nWhen possible, please send consolidated notes on this link so we can keep feedback in one place.\n\nThanks!\n{sender}',
    },
  },
  {
    id: 'faltan-materiales',
    title: { es: 'Faltan materiales', en: 'Missing materials' },
    category: { es: 'Produccion', en: 'Production' },
    channel: 'WhatsApp',
    tone: { es: 'Directo', en: 'Direct' },
    body: {
      es: 'Hola {client}, como estas?\n\nPara poder avanzar con {piece} de {project}, nos falta recibir materiales o definiciones pendientes.\n\nPendiente principal: {notes}\n\nApenas lo tengamos, retomamos y actualizamos fecha de entrega.\n\nGracias!\n{sender}',
      en: 'Hi {client}, how are you?\n\nTo move forward with {piece} for {project}, we still need pending materials or definitions.\n\nMain pending item: {notes}\n\nAs soon as we have it, we will resume and update the delivery date.\n\nThanks!\n{sender}',
    },
  },
  {
    id: 'demora-cuidada',
    title: { es: 'Ajuste de fecha', en: 'Date adjustment' },
    category: { es: 'Seguimiento', en: 'Follow-up' },
    channel: 'Mail / WhatsApp',
    tone: { es: 'Cuidado', en: 'Careful' },
    body: {
      es: 'Hola {client}, como estas?\n\nQueremos avisarles que {piece} para {project} necesita un poco mas de trabajo para llegar con la terminacion que buscamos.\n\nNuevo estimado de entrega: {deliveryDate}.\n\n{notes}\n\nGracias por la paciencia.\n{sender}',
      en: 'Hi {client}, how are you?\n\nWe wanted to let you know that {piece} for {project} needs a bit more work to reach the finish we are aiming for.\n\nNew estimated delivery: {deliveryDate}.\n\n{notes}\n\nThanks for your patience.\n{sender}',
    },
  },
  {
    id: 'entrega-final',
    title: { es: 'Entrega final', en: 'Final delivery' },
    category: { es: 'Cierre', en: 'Wrap-up' },
    channel: 'Mail',
    tone: { es: 'Formal', en: 'Formal' },
    body: {
      es: 'Hola {client}, como estas?\n\nLes compartimos la entrega final de {piece} para {project}.\n\nLink: {link}\n\nQuedamos atentos por cualquier cosa que necesiten para cerrar el proceso.\n\nGracias!\n{sender}',
      en: 'Hi {client}, how are you?\n\nSharing the final delivery of {piece} for {project}.\n\nLink: {link}\n\nWe remain available for anything else you need to close the process.\n\nThanks!\n{sender}',
    },
  },
]

const defaultState = {
  language: 'es',
  fields: defaultFields,
  templates: defaultTemplates,
  selectedId: defaultTemplates[0].id,
  history: [],
}

function localized(value, language) {
  if (typeof value === 'string') return value
  return value?.[language] || value?.es || value?.en || ''
}

function normalizeTemplate(template) {
  return {
    ...template,
    title: typeof template.title === 'string' ? { es: template.title, en: template.title } : template.title,
    category: typeof template.category === 'string' ? { es: template.category, en: template.category } : template.category,
    tone: typeof template.tone === 'string' ? { es: template.tone, en: template.tone } : template.tone,
    body: typeof template.body === 'string' ? { es: template.body, en: template.body } : template.body,
  }
}

function normalizeState(state) {
  const language = state?.language === 'en' ? 'en' : 'es'
  const oppositeLanguage = language === 'en' ? 'es' : 'en'
  const fields = translateDefaultFieldValues(
    { ...defaultFieldsByLanguage[language], ...state?.fields, statusKey: state?.fields?.statusKey || 'post' },
    oppositeLanguage,
    language,
  )
  return {
    ...defaultState,
    ...state,
    fields,
    templates: (state?.templates?.length ? state.templates : defaultTemplates).map(normalizeTemplate),
    selectedId: state?.selectedId || defaultTemplates[0].id,
    history: state?.history || [],
    language,
  }
}

function fillTemplate(template, fields, language) {
  const status = statuses.find((item) => item.key === fields.statusKey) || statuses[0]
  const values = {
    ...fields,
    status: status[language],
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || '')
}

function translateDefaultFieldValues(fields, fromLanguage, toLanguage) {
  const source = defaultFieldsByLanguage[fromLanguage]
  const target = defaultFieldsByLanguage[toLanguage]
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [
    key,
    value === source?.[key] ? target?.[key] ?? value : value,
  ]))
}

function App() {
  const initialState = normalizeState(loadLocalState(defaultState))
  const [language, setLanguage] = useState(initialState.language)
  const [fields, setFields] = useState(initialState.fields)
  const [templates, setTemplates] = useState(initialState.templates)
  const [selectedId, setSelectedId] = useState(initialState.selectedId)
  const [history, setHistory] = useState(initialState.history)
  const [copied, setCopied] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [cloudLoaded, setCloudLoaded] = useState(!isCloudStorageEnabled())
  const [cloudStatus, setCloudStatus] = useState(isCloudStorageEnabled() ? 'cloudLoading' : 'cloudOff')
  const firstCloudSave = useRef(true)

  const text = copy[language]
  const selectedTemplate = templates.find((template) => template.id === selectedId) || templates[0]
  const snapshot = useMemo(() => ({
    language,
    fields,
    templates,
    selectedId,
    history,
  }), [language, fields, templates, selectedId, history])
  const initialSnapshot = useRef(snapshot)
  const message = useMemo(
    () => fillTemplate(localized(selectedTemplate.body, language), fields, language),
    [selectedTemplate, fields, language],
  )

  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      if (!isCloudStorageEnabled()) return
      try {
        const shared = await loadSharedState(null)
        if (cancelled) return
        if (shared) {
          const next = normalizeState(shared)
          setLanguage(next.language)
          setFields(next.fields)
          setTemplates(next.templates)
          setSelectedId(next.selectedId)
          setHistory(next.history)
        } else {
          await saveSharedState(initialSnapshot.current)
        }
        setCloudStatus('cloudReady')
      } catch {
        if (!cancelled) setCloudStatus('cloudError')
      } finally {
        if (!cancelled) setCloudLoaded(true)
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveLocalState(snapshot)
    if (!cloudLoaded || !isCloudStorageEnabled()) return undefined
    if (firstCloudSave.current) {
      firstCloudSave.current = false
      return undefined
    }
    setCloudStatus('cloudSaving')
    const timeout = window.setTimeout(() => {
      saveSharedState(snapshot)
        .then(() => setCloudStatus('cloudReady'))
        .catch(() => setCloudStatus('cloudError'))
    }, 450)
    return () => window.clearTimeout(timeout)
  }, [snapshot, cloudLoaded])

  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }))

  const changeLanguage = (nextLanguage) => {
    setFields((current) => translateDefaultFieldValues(current, language, nextLanguage))
    setLanguage(nextLanguage)
  }

  const updateTemplateLocalized = (key, value, targetLanguage = language) => {
    setTemplates((items) => items.map((template) => {
      if (template.id !== selectedTemplate.id) return template
      return { ...template, [key]: { ...template[key], [targetLanguage]: value } }
    }))
  }

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setHistory((items) => [
      {
        id: crypto.randomUUID(),
        template: localized(selectedTemplate.title, language),
        client: fields.client,
        project: fields.project,
        copiedAt: new Date().toISOString(),
        language,
      },
      ...items,
    ].slice(0, 12))
    window.setTimeout(() => setCopied(false), 1600)
  }

  const addTemplate = () => {
    const fresh = {
      id: crypto.randomUUID(),
      title: { es: 'Nuevo mensaje', en: 'New message' },
      category: { es: 'Personalizado', en: 'Custom' },
      channel: 'WhatsApp',
      tone: { es: 'Neutro', en: 'Neutral' },
      body: {
        es: 'Hola {client}, como estas?\n\nTe escribimos por {project}.\n\n{nextStep}\n\nGracias!\n{sender}',
        en: 'Hi {client}, how are you?\n\nWriting about {project}.\n\n{nextStep}\n\nThanks!\n{sender}',
      },
    }
    setTemplates((items) => [fresh, ...items])
    setSelectedId(fresh.id)
    setEditingTemplate(true)
  }

  const deleteTemplate = () => {
    if (templates.length === 1) return
    const nextTemplates = templates.filter((template) => template.id !== selectedTemplate.id)
    setTemplates(nextTemplates)
    setSelectedId(nextTemplates[0].id)
  }

  const resetAll = () => {
    setLanguage('es')
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
            <span>{text.appSubtitle}</span>
          </div>
        </div>

        <div className="language-switch">
          <span>{text.messageLanguage}</span>
          <div>
            <button className={language === 'es' ? 'active' : ''} onClick={() => changeLanguage('es')}>{text.spanish}</button>
            <button className={language === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>{text.english}</button>
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
              {localized(template.title, language)}
            </button>
          ))}
        </nav>

        <div className="side-total">
          <span>{text.activeMessage}</span>
          <strong>{localized(selectedTemplate.category, language)}</strong>
          <small>{selectedTemplate.channel} - {localized(selectedTemplate.tone, language)}</small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">{text.brandLine}</p>
            <h1>{text.heading}</h1>
          </div>
          <div className="toolbar">
            <span className={`cloud-pill ${cloudStatus === 'cloudReady' ? 'online' : ''}`}>
              {cloudStatus === 'cloudReady' || cloudStatus === 'cloudSaving' ? <Cloud size={14} /> : <CloudOff size={14} />}
              {text[cloudStatus]}
            </span>
            <button className="ghost" onClick={addTemplate}><Plus size={16} /> {text.new}</button>
            <button className="ghost" onClick={resetAll}><RotateCcw size={16} /> {text.reset}</button>
            <button className="primary" onClick={copyMessage}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? text.copied : text.copy}
            </button>
          </div>
        </header>

        <section className="workspace-grid">
          <div className="panel composer-panel">
            <SectionTitle icon={<Film />} eyebrow={text.variables} title={text.sendData} />
            <div className="form-grid">
              <Input label={text.client} value={fields.client} onChange={(value) => updateField('client', value)} />
              <Input label={text.project} value={fields.project} onChange={(value) => updateField('project', value)} />
              <Input label={text.piece} value={fields.piece} onChange={(value) => updateField('piece', value)} />
              <Select
                label={text.status}
                value={fields.statusKey}
                options={statuses.map((status) => ({ value: status.key, label: status[language] }))}
                onChange={(value) => updateField('statusKey', value)}
              />
              <Input label={text.deliveryDate} value={fields.deliveryDate} onChange={(value) => updateField('deliveryDate', value)} />
              <Input label={text.reviewRound} value={fields.reviewRound} onChange={(value) => updateField('reviewRound', value)} />
              <Input label={text.link} value={fields.link} onChange={(value) => updateField('link', value)} />
              <Input label={text.sender} value={fields.sender} onChange={(value) => updateField('sender', value)} />
            </div>
            <div className="two-col">
              <Textarea label={text.notes} value={fields.notes} onChange={(value) => updateField('notes', value)} />
              <Textarea label={text.nextStep} value={fields.nextStep} onChange={(value) => updateField('nextStep', value)} />
            </div>
          </div>

          <div className="panel preview-panel">
            <SectionTitle icon={<Send />} eyebrow={text.preview} title={localized(selectedTemplate.title, language)} />
            <div className="message-preview">{message}</div>
            <div className="quick-actions">
              <a className="ghost" href={`mailto:?subject=${encodeURIComponent(`${fields.project} - ${fields.piece}`)}&body=${encodeURIComponent(message)}`}>
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
              <SectionTitle icon={<Sparkles />} eyebrow={text.template} title={text.templateText} />
              <div className="toolbar">
                <button className="ghost" onClick={() => setEditingTemplate((value) => !value)}>
                  <Save size={16} /> {editingTemplate ? text.close : text.edit}
                </button>
                <button className="icon-button" title="Eliminar plantilla" onClick={deleteTemplate} disabled={templates.length === 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {editingTemplate ? (
              <div className="template-form">
                <div className="editor-language-note">
                  <Languages size={16} />
                  <span>{language === 'es' ? 'Editando version en castellano' : 'Editing English version'}</span>
                </div>
                <div className="form-grid compact">
                  <Input label={text.title} value={localized(selectedTemplate.title, language)} onChange={(value) => updateTemplateLocalized('title', value)} />
                  <Input label={text.category} value={localized(selectedTemplate.category, language)} onChange={(value) => updateTemplateLocalized('category', value)} />
                  <Input label={text.channel} value={selectedTemplate.channel} onChange={(value) => setTemplates((items) => items.map((template) => template.id === selectedTemplate.id ? { ...template, channel: value } : template))} />
                  <Input label={text.tone} value={localized(selectedTemplate.tone, language)} onChange={(value) => updateTemplateLocalized('tone', value)} />
                </div>
                <Textarea label={text.body} value={localized(selectedTemplate.body, language)} onChange={(value) => updateTemplateLocalized('body', value)} />
                <p className="token-help">{text.tokens}: {'{client}'} {'{project}'} {'{piece}'} {'{status}'} {'{deliveryDate}'} {'{reviewRound}'} {'{link}'} {'{notes}'} {'{nextStep}'} {'{sender}'}</p>
              </div>
            ) : (
              <div className="template-readonly">{localized(selectedTemplate.body, language)}</div>
            )}
          </div>

          <div className="panel history-panel">
            <SectionTitle icon={<Clipboard />} eyebrow={text.sharedRecord} title={text.latestCopied} />
            <div className="history-list">
              {history.length ? history.map((item) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.template}</strong>
                  <span>{item.client} - {item.project}</span>
                  <small>{new Date(item.copiedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</small>
                </div>
              )) : (
                <div className="empty-state">
                  <strong>{text.emptyTitle}</strong>
                  <p>{text.emptyBody}</p>
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
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
