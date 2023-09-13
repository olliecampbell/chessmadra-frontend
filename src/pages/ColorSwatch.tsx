import { Show } from "solid-js";

export const ColorSwatch = ({ className, showShade }: { className: string; showShade: boolean; }) => {
    return (
        <div class="flex row items-center justify-between font-semibold">
            <Show when={showShade}>
                <div class={`mr-2`}>{className.split("-")[2]}</div>
            </Show>
            <div class={`w-20 h-8 ${className} rounded`} />
        </div>
    );
};

