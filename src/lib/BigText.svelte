<script>
    let me;

    export function get() {
        console.log("AAA");
        return me.innerText;
    }

    export function set(value) {
        me.innerHTML = value;
    }

    export function height() {
        me.classList.remove('h-full');
        me.classList.add('h-auto');
        let height = me.scrollHeight;
        me.classList.remove('h-auto');
        me.classList.add('h-full');
        return height;
    }
</script>

<div class="w-full h-full bg-slate-900 text-white text-xl rounded-lg p-12 caret-white overflow-scroll" bind:this={me}>
    <p style="opacity: 0.5">Press Ctrl+V to paste your college essay here or press R to get a random one.</p>
</div>


