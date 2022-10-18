<script setup>
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { format } from '../util'
import { DAYS } from '../constants.js'
import vTooltip from '../directives/tooltip.js'

dayjs.extend(customParseFormat)

const props = defineProps({
  data:  Object,
  month: Number,
  year:  Number,
})

const dimensions = {
  width: 500,
  height: 230,
  margins: {
    top: 16,
    right: 24,
    bottom: 16,
    left: 24,
  },
  bar: {
    width: 50,
    height: 160,
  },
}

// Dynamically calculate gap to spread out bars across SVG width
dimensions.gap = ((dimensions.width - dimensions.margins.left - dimensions.margins.right) - (dimensions.bar.width * 7)) / 6

const colors = ['#ffffff', '#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a']

function colorScale(val) {
  const normalizedValue = val / max
  const category = Math.ceil(normalizedValue * colors.length)

  return colors[(category - 1)]
}

const graphData = {}

Object.keys(props.data).forEach(dateString => {
  const date = dayjs(dateString, 'YYYY-MM-DD')
  const dayOfWeek = date.day()
  let day = (dayOfWeek === 0) ? 7 : dayOfWeek
  
  if (!graphData[day]) {
    graphData[day] = 0
  }

  graphData[day] += props.data[dateString]
})

const values = Object.keys(graphData).reduce((arr, day) => {
  arr.push(graphData[day])
  return arr
}, [])
const max = Math.max(...values)

function getBarHeight(value, height) {
  const normalizedValue = value / max
  return (normalizedValue * height) - dimensions.margins.top
}
</script>

<template>
  <svg :width="dimensions.width" :height="dimensions.height" :viewBox="`0 0 ${dimensions.width} ${dimensions.height}`">
    <g :transform="`translate(${dimensions.margins.left})`">
      <g :transform="`translate(0 ${dimensions.margins.top + dimensions.bar.height + 35})`" class="label">
        <text :x="dimensions.bar.width / 2" y="0" text-anchor="middle">Mo</text>
        <text :x="dimensions.bar.width + dimensions.bar.width / 2 + (dimensions.gap)" y="0" text-anchor="middle">Di</text>
        <text :x="dimensions.bar.width * 2 + dimensions.bar.width / 2 + (dimensions.gap * 2)" y="0" text-anchor="middle">Mi</text>
        <text :x="dimensions.bar.width * 3 + dimensions.bar.width / 2 + (dimensions.gap * 3)" y="0" text-anchor="middle">Do</text>
        <text :x="dimensions.bar.width * 4 + dimensions.bar.width / 2 + (dimensions.gap * 4)" y="0" text-anchor="middle">Fr</text>
        <text :x="dimensions.bar.width * 5 + dimensions.bar.width / 2 + (dimensions.gap * 5)" y="0" text-anchor="middle" fill="#6b7280">Sa</text>
        <text :x="dimensions.bar.width * 6 + dimensions.bar.width / 2 + (dimensions.gap * 6)" y="0" text-anchor="middle" fill="#6b7280">So</text>
      </g>

      <template v-for="n in 7">
        <rect
          :x="(dimensions.bar.width + dimensions.gap) * (n - 1)"
          :y="dimensions.bar.height - ((graphData[n] / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
          :width="dimensions.bar.width"
          :height="((graphData[n] / max) * dimensions.bar.height)"
          :fill="colorScale(graphData[n])"
          v-tooltip="`${format(graphData[n])} Verwarnungen`"
        />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.label {
  font-family: 'Inter var';
  font-size: 0.75rem;
  font-weight: bold;
  fill: rgb(31, 41, 55)
}
</style>