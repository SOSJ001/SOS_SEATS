<script lang="ts">
	export let hoverBgColor: string = '';
	export let hoverTextColor: string = '';
	export let bgColor: string = 'bg-yellow-400';
	export let textColor: string = '';
	export let width:string =""
</script>

<button
	class=" text-center w-{width} shadow-lg bg-opacity-75 hover:bg-opacity-25 bg-{bgColor !== '' ? bgColor : ''} hover:bg-{hoverBgColor !== ''
		? hoverBgColor
		: ''} hover:text-{hoverTextColor !== '' ? hoverTextColor : ''} text-{textColor !== ''
		? textColor
		: ''} border rounded-lg p-2"
>
	<slot name="text">slot = text</slot>
</button>