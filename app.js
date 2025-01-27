// Inicialización de variables globales
let events = []
let currentEventId = null
const html5QrCode = new Html5Qrcode("reader")

// Elementos del DOM
const eventForm = document.getElementById("event-form")
const eventList = document.getElementById("event-list")
const currentEventSelect = document.getElementById("current-event")
const scanResult = document.getElementById("scan-result")
const promotersList = document.getElementById("promoters-list")

// Funciones de utilidad
function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function formatDateTime(date, time) {
  const dateObj = new Date(`${date}T${time}`)
  return dateObj.toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Gestión de eventos
eventForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const title = document.getElementById("event-title").value
  const date = document.getElementById("event-date").value
  const time = document.getElementById("event-time").value
  const description = document.getElementById("event-description").value

  addEvent(title, date, time, description)
  eventForm.reset()
})

function addEvent(title, date, time, description) {
  const newEvent = {
    id: generateId(),
    title,
    date,
    time,
    description,
    promoters: [],
  }
  events.push(newEvent)
  saveEvents()
  renderEventList()
  updateEventSelector()
}

function renderEventList() {
  eventList.innerHTML = ""
  events.forEach((event) => {
    const eventCard = document.createElement("div")
    eventCard.classList.add("event-card")
    eventCard.innerHTML = `
            <h3>${event.title}</h3>
            <p><strong><i class="far fa-calendar-alt"></i> Fecha y hora:</strong> ${formatDateTime(event.date, event.time)}</p>
            <p>${event.description}</p>
            <p><strong><i class="fas fa-users"></i> Promotores:</strong> ${event.promoters ? event.promoters.length : 0}</p>
        `
    eventList.appendChild(eventCard)
  })
}

function updateEventSelector() {
  currentEventSelect.innerHTML = ""
  const defaultOption = document.createElement("option")
  defaultOption.value = ""
  defaultOption.textContent = "Seleccione un evento"
  currentEventSelect.appendChild(defaultOption)

  events.forEach((event) => {
    const option = document.createElement("option")
    option.value = event.id
    option.textContent = event.title
    currentEventSelect.appendChild(option)
  })
}

// Escáner QR
const qrCodeSuccessCallback = (decodedText, decodedResult) => {
  if (currentEventId) {
    const event = events.find((e) => e.id === currentEventId)
    if (event) {
      try {
        const promoterData = JSON.parse(decodedText)
        if (!event.promoters) {
          event.promoters = []
        }
        const existingPromoter = event.promoters.find((p) => p.dni === promoterData.dni)
        if (existingPromoter) {
          existingPromoter.scans++
        } else {
          event.promoters.push({
            ...promoterData,
            scans: 1,
          })
        }
        saveEvents()
        renderPromotersList(event.promoters)
        scanResult.textContent = `Escaneo exitoso: ${promoterData.nombre}`
        scanResult.style.color = "var(--success-color)"
      } catch (error) {
        scanResult.textContent = "Error: Código QR inválido"
        scanResult.style.color = "var(--error-color)"
      }
    }
  } else {
    scanResult.textContent = "Por favor, seleccione un evento antes de escanear."
    scanResult.style.color = "var(--error-color)"
  }
}

const config = { fps: 10, qrbox: { width: 250, height: 250 } }

html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)

currentEventSelect.addEventListener("change", (e) => {
  currentEventId = e.target.value
  if (currentEventId) {
    const event = events.find((e) => e.id === currentEventId)
    renderPromotersList(event.promoters || [])
  } else {
    renderPromotersList([])
  }
})

function renderPromotersList(promoters) {
  promotersList.innerHTML = ""
  promoters.forEach((promoter) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${promoter.nombre}</td>
            <td>${promoter.dni}</td>
            <td>${promoter.celular}</td>
            <td>${promoter.scans}</td>
        `
    promotersList.appendChild(row)
  })
}

// Persistencia de datos
function saveEvents() {
  localStorage.setItem("events", JSON.stringify(events))
}

function loadEvents() {
  const savedEvents = JSON.parse(localStorage.getItem("events")) || []
  events = savedEvents.map((event) => ({
    ...event,
    promoters: event.promoters || [],
  }))
  renderEventList()
  updateEventSelector()
}

// Inicialización de la aplicación
loadEvents()

