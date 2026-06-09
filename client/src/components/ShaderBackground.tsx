import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const shaders = {
  home: `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    varying vec2 v_texCoord;

    void main() {
      vec2 uv = v_texCoord;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      float t = u_time * 0.2;
      
      for(float i = 1.0; i < 4.0; i++){
        p.x += 0.3 / i * sin(i * 3.0 * p.y + t + u_mouse.x/u_resolution.x * 2.0);
        p.y += 0.3 / i * cos(i * 3.0 * p.x + t + u_mouse.y/u_resolution.y * 2.0);
      }
      
      float r = 0.5 + 0.5 * sin(p.x + p.y + t);
      float g = 0.3 + 0.3 * cos(p.x - p.y + t * 0.5);
      float b = 0.1 + 0.1 * sin(p.y * 2.0 + t * 0.3);
      
      vec3 color = vec3(r * 0.3, g * 0.2, b * 0.05); 
      
      float glow = 0.05 / length(p * 0.5);
      color += vec3(1.0, 0.7, 0.0) * glow * (0.5 + 0.5 * sin(u_time));

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  menu: `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;

    void main() {
      vec2 uv = v_texCoord;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      float t = u_time * 0.15;
      
      for(float i = 1.0; i < 5.0; i++){
        p.x += 0.2 / i * sin(i * 3.0 * p.y + t);
        p.y += 0.2 / i * cos(i * 3.0 * p.x + t);
      }
      
      float r = 0.02 + 0.05 * sin(p.x + t);
      float g = 0.12 + 0.1 * cos(p.y + t * 0.5);
      float b = 0.18 + 0.1 * sin(p.x - p.y + t * 0.3);
      
      vec3 baseColor = vec3(r, g, b); 
      
      float sparkle = pow(abs(sin(p.x * 20.0 + t) * cos(p.y * 20.0 - t)), 30.0);
      vec3 sparkleColor = vec3(0.8, 1.0, 0.9) * sparkle * 0.6;
      
      vec3 finalColor = baseColor + sparkleColor;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  feed: `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = v_texCoord;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      vec3 color = vec3(0.08, 0.08, 0.09);

      float t = u_time * 0.1;
      float wave = sin(p.x * 2.0 + t) * cos(p.y * 1.5 - t);
      color += vec3(0.02, 0.02, 0.03) * wave;

      vec2 sparkleUv = uv * 80.0;
      vec2 ipos = floor(sparkleUv);
      vec2 fpos = fract(sparkleUv);
      
      float rand = hash(ipos);
      if (rand > 0.985) {
        float speed = 0.5 + rand * 2.0;
        float brightness = 0.5 + 0.5 * sin(u_time * speed + rand * 10.0);
        float size = 0.1 * brightness;
        float dist = length(fpos - 0.5);
        if (dist < size) {
          color += vec3(1.0, 0.85, 0.5) * (1.0 - dist/size) * brightness * 0.6;
        }
      }

      float glow = 0.15 / length(p - vec2(1.2, 0.8));
      color += vec3(0.4, 0.3, 0.1) * glow;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  booking: `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = v_texCoord;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      float t = u_time * 0.1;
      
      for(float i = 1.0; i < 4.0; i++){
        p.x += 0.3 / i * sin(i * 1.5 * p.y + t);
        p.y += 0.3 / i * cos(i * 1.5 * p.x + t);
      }
      
      float r = 0.4 + 0.2 * sin(p.x + p.y + t);
      float g = 0.3 + 0.15 * cos(p.x - p.y + t * 0.5);
      float b = 0.05 + 0.05 * sin(p.y * 2.0 + t * 0.3);
      
      vec3 baseColor = vec3(r * 0.15, g * 0.1, b * 0.05); 
      
      float shimmer = pow(random(uv * 0.5 + sin(u_time * 0.05)), 120.0);
      vec3 shimmerColor = vec3(1.0, 0.9, 0.7) * shimmer * 0.15;

      float flow = 0.02 / length(p * 0.3);
      vec3 goldSmoke = vec3(0.8, 0.6, 0.3) * flow * (0.4 + 0.2 * sin(u_time * 0.2));
      
      vec3 finalColor = baseColor + goldSmoke + shimmerColor;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const location = useLocation();

  const [disabled, setDisabled] = useState(() => {
    return localStorage.getItem('disable_webgl_bg') === 'true';
  });

  // Keep references to WebGL objects so we can rebuild/switch fragment shader
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Get active shader key based on route path
  const getShaderKey = (pathname: string): keyof typeof shaders => {
    const cleanPath = pathname.replace(/\/+$/, '');
    if (cleanPath.endsWith('/menu')) return 'menu';
    if (cleanPath.endsWith('/feed')) return 'feed';
    if (cleanPath.endsWith('/booking')) return 'booking';
    return 'home';
  };

  const activeShaderKey = getShaderKey(location.pathname);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ disabled: boolean }>;
      setDisabled(customEvent.detail.disabled);
    };
    window.addEventListener('webgl-toggle', handleToggle as EventListener);
    return () => window.removeEventListener('webgl-toggle', handleToggle as EventListener);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported by browser.');
      return;
    }
    glRef.current = gl;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, shaders[activeShaderKey]);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    programRef.current = program;

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeUniform = gl.getUniformLocation(program, 'u_time');
    const resUniform = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniform = gl.getUniformLocation(program, 'u_mouse');

    const handleResize = () => {
      const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
      const scale = isMobile ? 0.5 : 1.0;
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const render = (time: number) => {
      gl.useProgram(program);
      gl.uniform1f(timeUniform, time * 0.001);
      gl.uniform2f(resUniform, canvas.width, canvas.height);
      if (mouseUniform) {
        gl.uniform2f(mouseUniform, mouseRef.current.x, mouseRef.current.y);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [activeShaderKey, disabled]);

  if (disabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      id="shader-bg"
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      style={{ mixBlendMode: 'screen', opacity: activeShaderKey === 'feed' ? 0.9 : 0.8 }}
    />
  );
}

export default ShaderBackground;
