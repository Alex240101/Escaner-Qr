// Inicialización de variables globales
let events = []
let currentEventId = null
let html5QrCode
let isScanning = false

// Elementos del DOM
const eventForm = document.getElementById("event-form")
const eventList = document.getElementById("event-list")
const currentEventSelect = document.getElementById("current-event")
const scanResult = document.getElementById("scan-result")
const promotersList = document.getElementById("promoters-list")
const openScannerBtn = document.getElementById("open-scanner-btn")
const loadImageBtn = document.getElementById("load-image-btn")
const qrInputFile = document.getElementById("qr-input-file")
const scannerModal = document.getElementById("scanner-modal")
const confirmationModal = document.getElementById("confirmation-modal")
const closeBtn = document.querySelector(".close")
const confirmationMessage = document.getElementById("confirmation-message")

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

// Manejo del escáner QR
function initializeScanner() {
  html5QrCode = new Html5Qrcode("reader")
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true,
    },
    rememberLastUsedCamera: true,
    aspectRatio: 1.0,
  }

  document.getElementById("scan-animation").style.display = "block"
  isScanning = true

  html5QrCode
    .start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {
      // Manejo de errores silencioso para evitar logs innecesarios
    })
    .catch((err) => {
      console.error(`Unable to start scanning, error: ${err}`)
    })
}

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
  if (!isScanning) return

  isScanning = false
  document.getElementById("scan-animation").style.display = "none"

  try {
    const promoterData = JSON.parse(decodedText)
    processPromoterData(promoterData)
  } catch (error) {
    console.error("Error parsing QR code data:", error)
    showConfirmation("Error: Código QR inválido", true)
  }
}

function processPromoterData(promoterData) {
  if (currentEventId) {
    const event = events.find((e) => e.id === currentEventId)
    if (event) {
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
      showConfirmation(`Escaneo exitoso: ${promoterData.nombre}`)
    }
  } else {
    showConfirmation("Por favor, seleccione un evento antes de escanear.", true)
  }

  if (html5QrCode) {
    html5QrCode
      .stop()
      .then(() => {
        console.log("Escáner detenido después de un escaneo exitoso")
      })
      .catch((err) => {
        console.error("Error al detener el escáner:", err)
      })
  }
}

function showConfirmation(message, isError = false) {
  confirmationMessage.textContent = message
  confirmationMessage.style.color = isError ? "var(--error-color)" : "var(--success-color)"
  confirmationModal.style.display = "block"
  setTimeout(() => {
    confirmationModal.style.display = "none"
    if (!isError) {
      closeScannerModal()
    }
  }, 2000)
}

// Manejo de modales
openScannerBtn.onclick = () => {
  scannerModal.style.display = "block"
  initializeScanner()
}

loadImageBtn.onclick = () => {
  qrInputFile.click()
}

qrInputFile.addEventListener("change", (event) => {
  if (event.target.files.length == 0) {
    return
  }
  const imageFile = event.target.files[0]

  html5QrCode = new Html5Qrcode("reader")
  html5QrCode
    .scanFile(imageFile, true)
    .then((decodedText) => {
      processQRCode(decodedText)
    })
    .catch((err) => {
      console.log(`Error scanning file. Reason: ${err}`)
      showConfirmation("Error al escanear la imagen. Por favor, intente con otra imagen.", true)
    })
})

closeBtn.onclick = closeScannerModal

window.onclick = (event) => {
  if (event.target == scannerModal) {
    closeScannerModal()
  }
}

function closeScannerModal() {
  scannerModal.style.display = "none"
  if (html5QrCode) {
    html5QrCode
      .stop()
      .then(() => {
        console.log("Escáner detenido")
        html5QrCode.clear()
      })
      .catch((err) => {
        console.error("Error al detener el escáner:", err)
      })
  }
  document.getElementById("scan-animation").style.display = "none"
  isScanning = false
}

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

