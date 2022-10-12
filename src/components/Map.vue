<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import mapPlaceHolderImage from '../../resources/map_placeholder.jpg'

// Props
const props = defineProps({
  records: Array,
})

let map = null
let streetsLayer = null
let streetMap = null

const FILTER = {
  LOCATION: 'location',
  CHARGE: 'charge'
}

const initialMapOptions = {
  center: [ 51.4549, 7.0156 ],
  zoom: 12,
}

// Data
let searchTerm = ref('')
const showMap = ref(false)
let filter = ref(FILTER.LOCATION)

// Computed Properties
const matchedRecords = computed(() => {
  if (searchTerm.value === '') {
    return []
  }

  const lcSearchTerm = searchTerm.value.toLowerCase()

  const filterFunctions = {
    location: record => record.location_lowercase.includes(lcSearchTerm),
    charge: record => record.charge === searchTerm.value || record.title_lowercase.includes(lcSearchTerm),
  }

  let records = props.records.filter(filterFunctions[filter.value])

  if (FILTER.CHARGE === filter) {
    return [...new Set(records)]
  }

  return records
})

const selectedStreets = computed(() => {
  const geojson = {
    type: 'FeatureCollection',
    features: [],
  }

  if (searchTerm.value === '') {
    geojson.features = []
    return geojson
  }

  if (FILTER.LOCATION === filter) {    
    if (!streetMap[searchTerm.value]) {
      return geojson
    }

    geojson.features = []

    for (let geometry of streetMap[searchTerm.value].geometry) {
      geojson.features.push({
        type: 'Feature',
        properties: {
          name: searchTerm.value,
        },
        geometry,
      })
    }
  } else {
    geojson.features = []
    const streetList = [...new Set(matchedRecords.value.map(record => record.location))]

    for (let streetName of streetList) {
      if (!streetMap[streetName]) {
        console.error(`Could not find geometry for ${streetName}`)
        continue
      }

      for (let geometry of streetMap[streetName].geometry) {
        geojson.features.push({
          type: 'Feature',
          properties: {
            name: streetName,
          },
          geometry,
        })
      }
    }
  }

  return geojson
})

const searchFieldLabel = computed(() => {
  return (FILTER.LOCATION === filter.value) ? 'Nach Straße suchen' : 'Nach Tatbestand (Stichwort/Nr.) suchen'
})

const searchFieldDatalist = computed(() => {
  return (FILTER.LOCATION === filter.value) ? 'streetnames' : null
})

const streetNames = computed(() => {
  const uniqueSet = (acc, record) => {
    acc.add(record.location)
    return acc
  }

  return [...props.records.reduce(uniqueSet, new Set)].sort((a, b) => a < b ? -1 : 1)
})

const chargeIds = computed(() => {
  const uniqueSet = (acc, record) => {
    acc.add(record.charge)
    return acc
  }

  return [...props.records.reduce(uniqueSet, new Set)].sort((a, b) => a < b ? -1 : 1)
})

const locationButtonClass = computed(() => {
  if (filter.value === FILTER.LOCATION) {
    return 'border-b-2 border-blue-500'
  }

  return 'text-gray-500 hover:text-gray-800'
})

const chargeButtonClass = computed(() => {
  if (filter.value === FILTER.CHARGE) {
    return 'border-b-2 border-blue-500'
  }

  return 'text-gray-500 hover:text-gray-800'
})

// Watcher
watch(selectedStreets, () => {
  map.removeLayer(streetsLayer)
  streetsLayer = L.geoJSON(selectedStreets.value)
  streetsLayer.addTo(map)

  const bounds = streetsLayer.getBounds()

  if (bounds.isValid()) {
    map.fitBounds(streetsLayer.getBounds())
    return
  }

  map.setView(initialMapOptions.center, initialMapOptions.zoom)
})

watch(showMap, () => {
  if (!showMap) {
    return
  }

  instantiateMap()
})

async function instantiateMap() {
  const response = await window.fetch('/streets.geojson')
  streetMap = await response.json()

  map = L.map('map', {
    minZoom: 12,
    maxZoom: 16,
  }).setView(initialMapOptions.center, initialMapOptions.zoom)

  L.tileLayer.wms('https://geodaten.metropoleruhr.de/spw2', {
    layers: 'spw2_graublau',
    width: 512,
    height: 512,
    format: 'image/jpeg',
    attribution: 'Stadtplanwerk Ruhrgebiet 2.0 © Regionalverband Ruhr und Kooperationspartner (Datenlizenz Deutschland - Namensnennung - Version 2.0), Datengrundlagen: ALKIS, ATKIS - Land NRW/Katasterämter (Datenlizenz Deutschland - Zero - Version 2.0) und © OpenStreetMap - Mitwirkende (License: Open Database License)'
  }).addTo(map)

  streetsLayer = L.geoJSON(selectedStreets.value)
  streetsLayer.addTo(map)
}

function resetFilter() {
  searchTerm.value = ''
  map.removeLayer(streetsLayer)
  map.setView(initialMapOptions.center, initialMapOptions.zoom)
}
</script>

<template>
  <section>
    <div class="flex justify-between mb-8">
      <h2 class="text-3xl font-bold">Alle Ordnungswidrigkeiten</h2>
      <div class="flex">
        <button @click="filter = FILTER.LOCATION;resetFilter()" :disabled="!showMap" class="mr-4" :class="locationButtonClass">nach Ort</button>
        <button @click="filter = FILTER.CHARGE;resetFilter()" :disabled="!showMap" :class="chargeButtonClass">nach Tatbestand</button>
      </div>
    </div>
    <div class="grid grid-cols-[70%_30%] h-[70vh] overflow-hidden bg-gray-50 rounded-md">
      <div class="h-[70vh] relative">
        <div id="map" class="w-full h-full z-0" ref="map"></div>
        <div v-if="!showMap" class="absolute top-0 left-0 right-0 bottom-0 z-10 bg-cover flex place-content-center" :style="`background-image: url(${mapPlaceHolderImage})`">
          <div class="max-w-md text-center place-self-center">
            <p class="text-lg mb-4">Die Karte wird von <mark class="mark-yellow">metropoleruhr.de</mark> geladen. Dabei wird deine IP-Adresse übertragen. Klicke auf „Karte anzeigen“ wenn du damit einverstanden bist.</p>
            <button @click="showMap = true" class="bg-gray-800 px-4 py-2 text-gray-100 rounded-md">Karte anzeigen</button>
          </div> 

        </div>
      </div>  
      <div class="h-[70vh]">
        <input
          type="text"
          class="w-full h-14 p-2 border-0 shadow"
          v-model.lazy="searchTerm"
          :placeholder="searchFieldLabel"
          :list="searchFieldDatalist"
          :disabled="!showMap"
        />
        <div class="h-[calc(100%-56px)] overflow-y-scroll p-2">
          <div v-if="searchTerm && matchedRecords.length === 0" class="w-full text-lg">
            Keine Treffer für <span class="text-gray-500">{{ searchTerm }}</span>
          </div>
          <template v-if="FILTER.LOCATION === filter">
            <div v-for="record in matchedRecords" class="mb-2 p-2 bg-white text-sm shadow">
              <span class="block mb-2 text-gray-400">{{ record.date }}</span>
              <span class="block mb-2">{{ record.title }}</span>
              <Tag>{{ record.charge }}</Tag>
            </div>
          </template>
          <template v-if="FILTER.CHARGE === filter">
            <div v-for="record in matchedRecords" class="mb-2 p-2 bg-white text-sm shadow">
              <span class="block mb-2 text-gray-400">{{ record.date }}</span>
              <span class="block mb-2">{{ record.location }}</span>
              <span class="block mb-2 text-gray-600 text-sm">{{ record.title }}</span>
              <Tag>{{ record.charge }}</Tag>
            </div>
          </template>
        </div>
      </div>
    </div>
    <datalist id="streetnames">
      <option v-for="name in streetNames">{{ name }}</option>
    </datalist>
  </section>
</template>