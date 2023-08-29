import { For } from "solid-js"

export default () => {
  return (
      <div class="w-full min-h-screen bg-gray-14 p-20 flex center">
      <div class="flex row">
      <Swatches hue="gray" step={5}/>
      <div class="flex row ml-4 space-x-4">
      <Swatches hue="red" step={10}/>
      <Swatches hue="green" step={10}/>
      <Swatches hue="blue" step={10}/>
      <Swatches hue="orange" step={10}/>
      <Swatches hue="yellow" step={10}/>
      <Swatches hue="purple" step={10}/>
      </div>
      </div>


      </div>
      )
}

const ColorSwatch = ({ className }: { className?: string }) => {
  return (
      <div class="flex row items-center justify-between font-semibold">
      {className.split("-")[1]} {className.split("-")[2]} <div class={`ml-4 w-20 h-8 ${className} rounded`}/>
      </div>
      )
}

const Swatches = ({hue, step}: {hue: string, step: number}) => {

const shades = []
for (let i = 90; i >= 0; i -= step) {
  shades.push(
    i
  )
}
return (
      <div class="flex space-y-2">
      <For each={shades}>
      {shade => <ColorSwatch className={`bg-${hue}-${shade}`}/> }
      </For>
      </div>
)
}
