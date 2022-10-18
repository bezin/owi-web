<script setup>
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { format } from '../util'
import { MONTHS } from '../constants.js'
import vTooltip from '../directives/tooltip.js'

dayjs.extend(customParseFormat)

const props = defineProps({
  data:  Object,
  month: Number,
  year:  Number,
})

const headerHeight = 60
const width = 55
const height = 65
const gap = 3

const svgWidth = computed(() => {
  return (width * 7) + (gap * 6)
})

const svgHeight = computed(() => {
  return (height * 5) + (gap * 4) + headerHeight
})

const firstDay = new Date(props.year, (props.month-1), 1)
const dayOfWeek = firstDay.getDay()

const calendarData = [
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
]

const data = Array.from(Object.entries(props.data)).map(record => record[1])

let week = 0
let day = (dayOfWeek === 0) ? 6 : dayOfWeek - 1

for (let i = 0; i < data.length; i++) {
  if (day === 7) {
    week++
    day = 0
  }


  calendarData[week][day] = { 
    value: data[i],
    date: dayjs(`${props.year}-${props.month}-${(1 + i)}`, 'YYYY-M-D'),
  }

  day++
}

const values = Object.keys(props.data).reduce((arr, day) => {
  arr.push(props.data[day])
  return arr
}, [])
const max = Math.max(...values)

const colors = ['#ffffff', '#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a']

function colorScale(val) {
  const normalizedValue = val / max
  const category = Math.ceil(normalizedValue * colors.length)

  return colors[(category - 1)]
}

function getFill(n, week) {
  const data = calendarData[(week - 1)][(n - 1)]

  if (data === null) {
    return 'rgba(255,255,255,0.7)'
  }

  return colorScale(data.value)
}

function getTooltipContent(week, weekDay) {
  if (null === calendarData[week - 1][weekDay - 1]) {
    return
  }

  const data = calendarData[week - 1][weekDay - 1]

  return `${format(data.value)} Verwarnungen`
}

function getDate(week, dayOfWeek) {
  if (null === calendarData[week - 1][dayOfWeek - 1]) {
    return
  }

  const data = calendarData[week - 1][dayOfWeek - 1]
  return data.date
}
</script>

<template>
  <svg :width="svgWidth" :height="svgHeight" :viewBox="`0 0 ${svgWidth} ${svgHeight}`" style="transform: rotateZ(5)">
    
    <rect x="0" y="0" :width="svgWidth" :height="headerHeight" fill="white" />
    <text x="5" y="24" fill="rgb(31, 41, 55)" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">{{ MONTHS[props.month] }} {{ props.year }}</text>
    
    <g transform="translate(4 50)">
      <text :x="(width + gap) * 1 - (width + gap) + 2" y="0" fill="rgb(31, 41, 55)" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">MO</text>
      <text :x="(width + gap) * 2 - (width + gap) + 2" y="0" fill="rgb(31, 41, 55)" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">DI</text>
      <text :x="(width + gap) * 3 - (width + gap) + 2" y="0" fill="rgb(31, 41, 55)" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">MI</text>
      <text :x="(width + gap) * 4 - (width + gap) + 2" y="0" fill="rgb(31, 41, 55)" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">DO</text>
      <text :x="(width + gap) * 5 - (width + gap) + 2" y="0" fill="rgb(31, 41, 55)" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">FR</text>
      <text :x="(width + gap) * 6 - (width + gap) + 2" y="0" fill="#6b7280" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">SA</text>
      <text :x="(width + gap) * 7 - (width + gap) + 2" y="0" fill="#6b7280" style="font-size: 1rem; font-family: 'Inter var'; font-weight: bold">SO</text>
    </g>

    <g v-for="week in 5" :transform="`translate(0, ${headerHeight + gap})`">
      <g v-for="n in 7" :transform="`translate(${(width + gap) * n - (width + gap)}, ${(height + gap) * week - (height + gap)})`">
        <rect
          :width="width"
          :height="height"
          :fill="getFill(n, week)"
          v-tooltip="getTooltipContent(week, n)"
        />

        <rect
          v-if="null !== calendarData[week-1][n-1]"
          x="0"
          y="0"
          width="24"
          height="24"
          fill="white"
          style="opacity: 0.95"
        />

        <text
          v-if="null !== calendarData[week-1][n-1]"
          x="0"
          y="0"
          fill="rgb(31, 41, 55)"
          transform="translate(12 16)"
          style="text-anchor: middle; font-family: 'Inter var'; font-size: 0.75rem; font-weight: bold;"
        >
          {{ getDate(week, n).format('D') }}
        </text>
      </g>
    </g>
  </svg>
</template>