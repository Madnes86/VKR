<script lang="ts">

    let {
        width = 60,
        height = 60,
        stroke = '#835CFD',
        fill = '#FFF',
        row = false
    } : {
        width?: number;
        height?: number;
        stroke?: string;
        fill?: string;
        row?: boolean;
    } = $props();
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx={width / 2} cy={height / 2} r={height / 3} {stroke} stroke-width={height / 9}/>
    <defs>  
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        </style>
    </defs>
    
    <text
        x={width / 2}
        y={height / 2}
        text-anchor="middle"
        font-family="'Fredoka One', 'Fredoka One', cursive"
        font-size="18"
        font-weight="normal"
        {fill}
        dominant-baseline="middle"
    >
        Orbita
    </text>
</svg>