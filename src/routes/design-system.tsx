import { For, Show } from "solid-js"

export default () => {
  return (
      <div class="w-full min-h-screen bg-gray-14 p-20 flex center">
      <div class="flex row">
      <Swatches hue="gray" step={5}/>
      <div class="flex row ml-4 space-x-1">
      <Swatches hue="red" step={10} showShade/>
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

const ColorSwatch = ({ className, showShade }: { className?: string }) => {
  return (
      <div class="flex row items-center justify-between font-semibold">
      <Show when={showShade}>

      <div class={`mr-2`}>
      {className.split("-")[2]} 
      </div>
      </Show>
      <div class={`w-20 h-8 ${className} rounded`}/>
      </div>
      )
}

const Swatches = ({hue, step, showShade}: {hue: string, step: number}) => {

const shades = []
for (let i = 90; i >= 0; i -= step) {
  shades.push(
    i
  )
}
return (
      <div class="flex space-y-2 items-center">
      <div class="font-semibold">
      {hue}
      </div>
      <For each={shades}>
      {shade => <ColorSwatch className={`bg-${hue}-${shade}`} showShade={showShade}/> }
      </For>
      </div>
)
}
