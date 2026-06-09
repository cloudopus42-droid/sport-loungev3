import{r as o,j as e}from"./vendor-framer-DOWGsZI5.js";function a({variant:s}){const t=o.useMemo(()=>{switch(s){case"cyber_premium":return{glowColor:"rgba(255, 191, 0, 0.4)",accentColor:"#FFBF00"};case"crystal_edition":return{glowColor:"rgba(6, 182, 212, 0.4)",accentColor:"#06B6D4"};case"chrome_abstract":return{glowColor:"rgba(236, 72, 153, 0.4)",accentColor:"#EC4899"};case"stealth_obsidian":default:return{glowColor:"rgba(255, 191, 0, 0.4)",accentColor:"#D4AF37"}}},[s]);return s==="cyber_premium"?e.jsxs("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none select-none",children:[e.jsx("div",{className:"absolute w-[450px] h-[450px] rounded-full bg-accent-gold/5 blur-[100px] animate-pulse"}),e.jsx("div",{className:"absolute inset-0 flex justify-center items-center overflow-hidden",children:e.jsxs("svg",{className:"w-full h-full max-w-lg opacity-30",viewBox:"0 0 400 400",fill:"none",children:[e.jsx("style",{children:`
                @keyframes float-smoke {
                  0% { transform: translateY(40px) scale(0.8); opacity: 0; }
                  50% { opacity: 0.5; }
                  100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
                }
                .smoke-particle {
                  animation: float-smoke 7s ease-in-out infinite;
                  transform-origin: center;
                }
              `}),e.jsx("circle",{className:"smoke-particle",cx:"200",cy:"300",r:"30",fill:"url(#gold-glow-grad)",style:{animationDelay:"0s"}}),e.jsx("circle",{className:"smoke-particle",cx:"160",cy:"270",r:"20",fill:"url(#gold-glow-grad)",style:{animationDelay:"2.5s"}}),e.jsx("circle",{className:"smoke-particle",cx:"240",cy:"250",r:"25",fill:"url(#gold-glow-grad)",style:{animationDelay:"5s"}}),e.jsx("defs",{children:e.jsxs("radialGradient",{id:"gold-glow-grad",cx:"0.5",cy:"0.5",r:"0.5",children:[e.jsx("stop",{offset:"0%",stopColor:"#FFBF00",stopOpacity:"0.4"}),e.jsx("stop",{offset:"100%",stopColor:"#FFBF00",stopOpacity:"0"})]})})]})})]}):e.jsxs("div",{className:"w-full h-full flex flex-col items-center justify-center relative select-none",children:[e.jsx("style",{children:`
          @keyframes pulse-glow {
            0%, 100% { filter: drop-shadow(0 0 15px ${t.glowColor}); opacity: 0.95; }
            50% { filter: drop-shadow(0 0 30px ${t.glowColor}); opacity: 1; }
          }
          @keyframes rise-steam {
            0% { transform: translateY(5px) scaleX(0.9); opacity: 0; }
            15% { opacity: 0.6; }
            80% { opacity: 0.3; }
            100% { transform: translateY(-30px) scaleX(1.3); opacity: 0; }
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
          .steam-line {
            animation: rise-steam 4s ease-in-out infinite;
            transform-origin: center bottom;
          }
        `}),e.jsxs("svg",{width:"120",height:"220",viewBox:"0 0 120 220",fill:"none",className:"animate-pulse-glow hover:scale-105 transition-transform duration-500 cursor-pointer",children:[e.jsx("path",{d:"M50 18 Q45 5 53 -5",stroke:t.accentColor,strokeWidth:"1.5",strokeLinecap:"round",opacity:"0.5",className:"steam-line",style:{animationDelay:"0.2s"}}),e.jsx("path",{d:"M60 18 Q65 7 57 -3",stroke:t.accentColor,strokeWidth:"1.5",strokeLinecap:"round",opacity:"0.5",className:"steam-line",style:{animationDelay:"1.8s"}}),e.jsx("path",{d:"M70 18 Q68 4 75 -7",stroke:t.accentColor,strokeWidth:"1.5",strokeLinecap:"round",opacity:"0.5",className:"steam-line",style:{animationDelay:"3s"}}),e.jsx("path",{d:"M48 20 H72 L70 32 H50 Z",fill:s==="stealth_obsidian"?"#1F2937":"#0F172A",stroke:t.accentColor,strokeWidth:"2"}),e.jsx("rect",{x:"58",y:"32",width:"4",height:"18",fill:t.accentColor,opacity:"0.7"}),e.jsx("ellipse",{cx:"60",cy:"32",rx:"26",ry:"5",fill:s==="stealth_obsidian"?"#1F2937":"#0F172A",stroke:t.accentColor,strokeWidth:"2"}),e.jsx("rect",{x:"58",y:"50",width:"4",height:"60",fill:t.accentColor}),e.jsx("circle",{cx:"60",cy:"65",r:"6",fill:s==="stealth_obsidian"?"#FFBF00":t.accentColor}),e.jsx("circle",{cx:"60",cy:"85",r:"5",fill:s==="stealth_obsidian"?"#FFBF00":t.accentColor}),e.jsx("circle",{cx:"60",cy:"105",r:"6",fill:s==="stealth_obsidian"?"#FFBF00":t.accentColor}),e.jsx("path",{d:"M50 110 H70 L72 120 H48 Z",fill:t.accentColor}),e.jsx("path",{d:"M60 120 C42 120 34 165 34 185 C34 195 44 200 60 200 C76 200 86 195 86 185 C86 165 78 120 60 120 Z",fill:"url(#glass-base-grad)",stroke:t.accentColor,strokeWidth:"2.5"}),e.jsx("path",{d:"M36 175 C45 180 75 180 84 175 C85 180 86 185 86 185 C86 195 76 200 60 200 C44 200 34 195 34 185 C34 185 35 180 36 175 Z",fill:t.accentColor,fillOpacity:"0.35"}),e.jsx("rect",{x:"59",y:"120",width:"2",height:"50",fill:t.accentColor,opacity:"0.6"}),e.jsx("line",{x1:"48",y1:"114",x2:"38",y2:"108",stroke:t.accentColor,strokeWidth:"2"}),e.jsx("line",{x1:"72",y1:"114",x2:"82",y2:"108",stroke:t.accentColor,strokeWidth:"2"}),e.jsx("defs",{children:e.jsxs("linearGradient",{id:"glass-base-grad",x1:"0%",y1:"0%",x2:"100%",y2:"100%",children:[e.jsx("stop",{offset:"0%",stopColor:"#1E293B",stopOpacity:"0.4"}),e.jsx("stop",{offset:"100%",stopColor:"#0F172A",stopOpacity:"0.9"})]})})]})]})}export{a as H};
