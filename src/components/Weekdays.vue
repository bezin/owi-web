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
  width: 0,
  height: 0,
  gap: 20,
  margins: {
    top: 16,
    right: 16,
    bottom: 32,
    left: 16,
  },
  bar: {
    width: 40,
    height: 150,
  },
}

dimensions.width = (dimensions.bar.width * 7) + (dimensions.gap * 6) + dimensions.margins.left + dimensions.margins.right
dimensions.height = dimensions.bar.height + dimensions.margins.top + dimensions.margins.bottom

const graphData = {}

const colors = ['#ffffff', '#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a']

function colorScale(val) {
  const normalizedValue = val / max
  const category = Math.ceil(normalizedValue * colors.length)

  return colors[(category - 1)]
}

Object.keys(props.data).forEach(dateString => {
  const date = dayjs(dateString, 'YYYY-MM-DD')
  const day = DAYS[date.day()]
  
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
      <g :transform="`translate(0 ${dimensions.height - 10})`" class="label">
        <text :x="dimensions.bar.width / 2" y="0" text-anchor="middle">Mo</text>
        <text :x="dimensions.bar.width + dimensions.bar.width / 2 + (dimensions.gap)" y="0" text-anchor="middle">Di</text>
        <text :x="dimensions.bar.width * 2 + dimensions.bar.width / 2 + (dimensions.gap * 2)" y="0" text-anchor="middle">Mi</text>
        <text :x="dimensions.bar.width * 3 + dimensions.bar.width / 2 + (dimensions.gap * 3)" y="0" text-anchor="middle">Do</text>
        <text :x="dimensions.bar.width * 4 + dimensions.bar.width / 2 + (dimensions.gap * 4)" y="0" text-anchor="middle">Fr</text>
        <text :x="dimensions.bar.width * 5 + dimensions.bar.width / 2 + (dimensions.gap * 5)" y="0" text-anchor="middle" fill="#6b7280">Sa</text>
        <text :x="dimensions.bar.width * 6 + dimensions.bar.width / 2 + (dimensions.gap * 6)" y="0" text-anchor="middle" fill="#6b7280">So</text>
      </g>
      <rect
        x="0"
        :y="dimensions.bar.height - ((graphData.Montag / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Montag, dimensions.bar.height)"
        :fill="colorScale(graphData.Montag)"
        v-tooltip="`${format(graphData.Montag)} Verwarnungen`"
      />
      <rect
        :x="dimensions.bar.width + dimensions.gap"
        :y="dimensions.bar.height - ((graphData.Dienstag / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Dienstag, dimensions.bar.height)"
        :fill="colorScale(graphData.Dienstag)"
        v-tooltip="`${format(graphData.Dienstag)} Verwarnungen`"
      />
      <rect
        :x="(dimensions.bar.width + dimensions.gap) * 2"
        :y="dimensions.bar.height - ((graphData.Mittwoch / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Mittwoch, dimensions.bar.height)"
        :fill="colorScale(graphData.Mittwoch)"
        v-tooltip="`${format(graphData.Mittwoch)} Verwarnungen`"
      />
      <rect
        :x="(dimensions.bar.width + dimensions.gap) * 3"
        :y="dimensions.bar.height - ((graphData.Donnerstag / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Donnerstag, dimensions.bar.height)"
        :fill="colorScale(graphData.Donnerstag)"
        v-tooltip="`${format(graphData.Donnerstag)} Verwarnungen`"
      />
      <rect
        :x="(dimensions.bar.width + dimensions.gap) * 4"
        :y="dimensions.bar.height - ((graphData.Freitag / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Freitag, dimensions.bar.height)"
        :fill="colorScale(graphData.Freitag)"
        v-tooltip="`${format(graphData.Freitag)} Verwarnungen`"
      />
      <rect
        :x="(dimensions.bar.width + dimensions.gap) * 5"
        :y="dimensions.bar.height - ((graphData.Samstag / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Samstag, dimensions.bar.height)"
        :fill="colorScale(graphData.Samstag)"
        v-tooltip="`${format(graphData.Samstag)} Verwarnungen`"
      />
      <rect
        :x="(dimensions.bar.width + dimensions.gap) * 6"
        :y="dimensions.bar.height - ((graphData.Sonntag / max) * dimensions.bar.height - dimensions.margins.top) + dimensions.margins.top"
        :width="dimensions.bar.width"
        :height="getBarHeight(graphData.Sonntag, dimensions.bar.height)"
        :fill="colorScale(graphData.Sonntag)"
        v-tooltip="`${format(graphData.Sonntag)} Verwarnungen`"
      />
    </g>
  </svg>
</template>

<style scoped>
.label {
  font-family: 'Inter var';
  font-size: 1rem;
  font-weight: bold;
}
</style>