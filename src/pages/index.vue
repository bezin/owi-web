<route lang="json">
{
  "meta": {
    "title": "OWI"
  }
}
</route>

<script setup>
import dayjs from 'dayjs'
import meta from '../../resources/owi_juli_2022.json'

const parseRecords = (csv) => {
  let recordId = 0

  return csv
    .map(row => {
      const record = row.split(',')
      recordId++
      const meta = catalog.find(c => c.tbnr === record[2])

      return {
        id: recordId,
        date: dayjs(record[0], 'YYYY-MM-DD').format('DD.MM.YYYY'),
        location: record[1],
        location_lowercase: record[1].toLowerCase(),
        charge: record[2],
        title: meta ? meta.description : '',
        title_lowercase: meta ? meta.description.toLowerCase() : '',
      }
    })
}

useHead({
  title: `${meta.title} / OWIs in Essen`,
})

// Helper
const format = (number) => {
  const formatter = new Intl.NumberFormat('de-DE')
  return formatter.format(number)
}

// Data
let chargesSearch = ref('')
let records = ref([])
let offencesByFrequency = ref([])
let catalog

// Computed
const offencesByFrequencyFiltered = computed(() => {
  return offencesByFrequency.value.filter((offence) => {

  if (chargesSearch.value === '') {
    return true
  }

  let matches = []
  const searchTerms = chargesSearch.value.split(' ')

  for (let term of searchTerms) {
    term = term.toLowerCase()
    matches.push(offence[1].toLowerCase().includes(term))
    matches.push(offence[2].filter((charge) => charge.includes(term)).length > 0)
  }

  matches = matches.filter(match => match)

  return matches.length > 0
})})

// Lifecycle

onMounted(async () => {
  const [ catalogData, csv ] = await Promise.all([
    (() => {
      return fetch('charges.json')
        .then(response => response.text())
        .then(text => JSON.parse(text))
        .catch(err => {
          console.error(err)
        })
    })(),
    (() => {
      return fetch('owi_juli_2022.csv')
        .then(response => response.text())
        .then(text => text.split('\n'))
        .catch(err => {
          console.error(err)
        })
    })(),
  ])

  catalog = catalogData  
  records.value = parseRecords(csv)

  const groupedCharges = records.value
    .map(record => record.charge)
    .reduce((acc, charge) => {
      if ('000000' === charge || 0 == charge) {
        return acc
      }

      const meta = catalog.find(c => c.tbnr === charge)

      if (meta == null) {
        return acc
      }

      const key = meta.description

      if (!acc[key]) {
        acc[key] = {
          count: 0,
          title: key,
          charges: new Set(),
        }
      }

      acc[key].charges.add(meta.tbnr)
      acc[key].count++
      return acc
    }, {})

  Object.keys(groupedCharges)
    .forEach(key => {
      const { charges, count } = groupedCharges[key]
      const chargeIds = [...charges].sort((a, b) => parseInt(a) < parseInt(b) ? -1 : 1)
      offencesByFrequency.value.push([count, key, chargeIds])
    })

  offencesByFrequency.value.sort((a, b) => {
    return a[0] < b[0] ? 1 : -1
  })
})
</script>

<template>
  <header class="min-h-[70vh] py-24 px-4 bg-gray-100 text-gray-800">
    <div class="max-w-3xl mx-auto h-full flex items-center">
      <p class="text-2xl md:text-4xl leading-normal md:leading-normal">
        Im <mark class="mark-yellow font-bold">{{ meta.title }}</mark> hat das Ordnungsamt der Stadt&nbsp;Essen <mark class="mark-yellow font-bold">{{ format(records.length) }}</mark>&nbsp;Verwarnungen im Verkehr ausgesprochen. Das sind rund <mark class="mark-yellow font-bold">{{ Math.ceil(records.length / 31) }}</mark>&nbsp;pro Tag. Wo und wofür könnt ihr auf dieser Seite herausfinden.
      </p>
    </div>
  </header>

  <main class="pt-16 bg-gray-100">
    <section class="bg-gray-800 px-4">
      <div class="relative -top-28 md:-top-32 max-w-3xl mx-auto">
        <header class="mx-auto mb-6 md:flex justify-between">
          <h2 class="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Die häufigsten Tatbestände</h2>
          <input type="text" v-model.trim="chargesSearch" class="inline-block mb-4 md:mb-0 md:ml-4 w-52 h-10 border-0 shadow" placeholder="Stichwort suchen">
        </header>
        <table class="block mx-auto mb-4 h-80 overflow-y-scroll text-sm border-2 border-gray-800 bg-white rounded-md">
          <tr v-if="offencesByFrequencyFiltered.length === 0" class="flex p-4">
            <td class="w-full">
              <div class="text-lg text-center">
                <span class="block">
                  Keine Treffer für <span class="text-gray-500">{{ chargesSearch }}</span>
                </span>
                <span class="block text-sm text-gray-400">
                  Durchsucht wurden <span class="text-gray-800">Titel</span> und <span class="text-gray-800">Tatbestandsnr.</span> 
                </span>
              </div>
            </td>
          </tr>
          <tr v-for="([count, title, charges], index) in offencesByFrequencyFiltered" class="flex p-4">
            <!-- <td class="w-8 mr-8">
              <span class="block w-6 h-6 py-1 px-0.5 bg-gray-500 text-xs text-gray-50 text-center rounded-full">{{ ++index }}</span>
            </td> -->
            <td class="w-16 mr-4 text-right text-lg">
              <span class="block">{{ format(count) }}</span>
              <span class="block text-gray-400 text-sm">{{ format((count / meta.offences * 100).toFixed(1)) }}%</span>
            </td>
            <td class="w-full pt-2">
              <span class="block mb-2">{{ title }}</span>
              <div class="flex flex-wrap align-start">
                <Tag v-for="charge in charges">{{ charge }}</Tag>
              </div>
            </td>
          </tr>
        </table>
        <small class="block text-gray-50 text-xs">In der obigen Tabelle sind ähnliche Tatbestände gruppiert: Zu schnelle fahren in einer 30er-Zone ist ein anderer Tatbestand, als zu schnell fahren, wo Tempo 30 angewiesen ist.</small>
      </div>
    </section>

    <Map class="py-20 p-8 max-w-7xl mx-auto" :records="records" />

    <section class="py-16 px-4 bg-gray-300">
      <div class="max-w-3xl mx-auto">
        <h2 class="font-bold text-xl mb-2">Datengrundlage</h2>
        <p class="text-lg mb-2">Die zugrundeliegenden Informationen wurden mithilfe der Plattform <a class="border-b-2 border-blue-500 hover:border-blue-200" href="https://fragdenstaat.de" target="_blank">fragdenstaat.de</a> auf Baiss des Informations&shy;freiheits&shy;gesetzes <a href="https://fragdenstaat.de/anfrage/ordnungswidrigkeiten-juli-2022-2/" class="border-b-2 border-blue-500 hover:border-blue-200" target="_blank">beim Ordnungsamt der Stadt Essen angefragt</a>. Die Antwort folgte relativ zügig auf 61 beidseitig, dreispaltig, in kleiner Schrift bedruckten DIN A4 Seiten, die eingescannt und mittels OCR maschinenlesbar gemacht wurden.</p>
        <p class="text-lg mb-2">Das so entstandene Zwischenergebnis wurde manuell nachbearbeitet werden, da die OCR Zeichen erkannt hat, die nicht da waren <em>(Merke: vorher die Scanneroberfläche gründlich reinigen)</em> oder seine Schwierigkeiten mit römischen Numeralen hatte <em>(Looking at you, I. bis III. Hagen).</em></p>
        <p class="text-lg mb-2">Sicherlich gibt es kleinere Erkennungsfehler, bei der Menge an Datensätzen ist es aber zu vernachlässigen. In einigen wenige Fällen waren die Ausgangsinformationen auch schon unvollständig (fehlende oder falsche Tatbestandsnr., fehlender Tatort).</p>
        <p class="text-lg">Den finalen Datensatz, auf dem auch diese Seite basiert, könnt ihr <a class="border-b-2 border-blue-500 hover:border-blue-200" href="https://raw.githubusercontent.com/bezin/owi-web/main/public/owi_juli_2022.csv" target="_blank"> auf GitHub herunterladen</a>.</p>
      </div>
    </section>
  </main>

  <footer class="max-w-3xl mx-auto py-8 px-4 text-sm grid grid-cols-2 md:grid-cols-3">
    <!-- Zugrundeliegende Daten freundlicherweise bereitgestellt durch das <a href="https://fragdenstaat.de/anfrage/ordnungswidrigkeiten-juli-2022-2/" class="border-b-2 border-blue-500 hover:border-blue-200" target="_blank">Ordnungsamt der Stadt Essen</a>.  -->
    <div class="block mb-4">
      <strong class="block mb-1">Problem gefunden?</strong>
      <ul>
        <li class="mb-1"><a href="https://twitter.com/b3zet" target="_blank">@b3zet</a></li>
        <li class="mb-1"><a href="mailto:hallo@mssll.de?subject=Eine%20Frage%20zu%20den%20Ordnungswidrigkeiten" target="_blank">hallo@mssll.de</a></li>
        <li class="mb-1"><a href="https://github.com/bezin/owi-web/issues" target="_blank">GitHub Issues</a></li>
      </ul>

    </div>
    <div>
      <ul>
        <li class="mb-1"><a href="https://westandforukraine.net/" target="_blank">#WeStandForUkraine</a></li>
        <li class="mb-1"><a href="https://fragdenstaat.de" target="_blank">fragdenstaat.de</a></li>
        <li class="mb-1"><a href="https://recht.nrw.de/lmi/owa/br_text_anzeigen?v_id=4820020930120743668" target="_blank">IFG NRW</a></li>
        <li class="mb-1"><a href="https://github.com/bezin/owi-web" target="_blank">GitHub</a></li>
      </ul>
    </div>
    <div class="block mb-4 col-span-2">
      Geodaten von <a href="https://openstreetmap.org" class="border-b-2 border-blue-500 hover:border-blue-200" target="_blank">Open Street Map</a><br>
      Tatbestandskatalog powered by <a href="https://weg.li" class="border-b-2 border-blue-500 hover:border-blue-200" target="_blank">weg.li</a> 
    </div>
  </footer>

  <aside class="py-8 px-4 bg-gray-100">
    <div class="max-w-3xl mx-auto text-xs">
      <p class="mb-2"><strong>Impressum</strong> owi.mssll.de ist ein privates Projekt von Benedict Massolle, Brunnenstraße 12, 40223 Düsseldorf. Ich bin auch inhaltlich verantwortlich nach §5 TMG. Ihr könnt mich erreichen unter <a href="mailto:hallo@mssll.de" class="border-b-2 border-blue-500 hover:border-blue-200" target="_blank">hallo@mssll.de</a></p>
      <p><strong>Datenschutzerklärung</strong> Diese Seite erhebt, speichert und verarbeitet keinerlei personenbezogene Daten. Mein Hosting Provider <a href="https://webhostone.de" class="border-b-2 border-blue-500 hover:border-blue-200" target="_blank">Webhost One</a> speichert gemäß seiner gesetzlichen Verpflichtung eure IP-Adresse für sieben Tage.</p>
    </div>
  </aside>
</template>
