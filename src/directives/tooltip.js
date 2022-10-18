import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

export default {
  mounted: (el, { value }) => {
    if (value) {
      tippy(el, {
        content: value,
        allowHTML: true,
      })
    }
  } 
}