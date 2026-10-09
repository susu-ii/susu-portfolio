(function (root) {
  'use strict';
  const shaders = {
    backgroundVertex: ['attribute vec2 a_position;', 'varying vec2 v_uv;', 'void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}'].join('\n'),
    backgroundFragment: [
      'precision mediump float;', 'varying vec2 v_uv; uniform vec2 u_resolution; uniform vec2 u_pointer;',
      'uniform float u_time; uniform float u_mix; uniform float u_strength;',
      'uniform sampler2D u_previous; uniform sampler2D u_next; uniform sampler2D u_type; uniform vec3 u_accent;',
      'float wave(vec2 p){return sin(p.x*2.5+u_time*.21)+cos(p.y*3.2-u_time*.18)+sin((p.x+p.y)*2.1-u_time*.11);}',
      'void main(){', 'vec2 p=(v_uv-.5)*vec2(u_resolution.x/u_resolution.y,1.);',
      'vec2 room=vec2(atan(p.x,.83)*1.15,p.y*(1.+pow(abs(p.x),1.65)*.30));', 'room+=u_pointer*vec2(.035,.018);',
      'float w=wave(room*1.7);', 'vec2 liquid=room+vec2(sin(w+room.y*3.),cos(w+room.x*2.))*.095;',
      'vec2 artUV=vec2(liquid.x*.64+.5, .68-liquid.y*.91);',
      'vec3 art=mix(texture2D(u_previous,clamp(artUV,0.,1.)).rgb,texture2D(u_next,clamp(artUV,0.,1.)).rgb,u_mix);',
      'float luminance=dot(art,vec3(.2126,.7152,.0722));', 'vec3 col=vec3(.025,.027,.033)+mix(vec3(luminance),art,.52)*.15;',
      'float ribbon=pow(.5+.5*sin(w*2.3+room.x*3.-u_time*.14),14.);', 'vec3 spectrum=.5+.5*cos(vec3(0.,2.1,4.2)+w*1.5+room.x*2.);',
      'col+=spectrum*ribbon*.115+u_accent*.025;', 'vec2 cell=room*vec2(14.,16.);vec2 line=abs(fract(cell)-.5);',
      'vec2 aa=vec2(14.,16.)/u_resolution.y*1.4;', 'float grid=max(smoothstep(.5-aa.x,.5,line.x),smoothstep(.5-aa.y,.5,line.y));',
      'col=mix(col,vec3(.008,.009,.012),grid*.85);', 'vec2 typeUV=vec2(room.x*.34+.5,room.y*.55+.5);',
      'float type=texture2D(u_type,typeUV).a;', 'col+=vec3(.17,.18,.20)*type*.20;',
      'float edge=1.-smoothstep(.24,1.07,length(p*vec2(.65,1.18)));', 'col*=mix(.30,1.,edge);',
      'float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);', 'col+=(grain-.5)*.006;', 'gl_FragColor=vec4(col*u_strength,1.);}'
    ].join('\n'),
    cardVertex: ['attribute vec3 a_position; attribute vec2 a_uv; uniform mat4 u_matrix;', 'uniform float u_bend; uniform float u_time; varying vec2 v_uv;', 'void main(){vec3 p=a_position;p.z-=p.x*p.x*u_bend;p.z+=sin(a_uv.x*3.14159)*sin(u_time*.5)*.008;v_uv=a_uv;gl_Position=u_matrix*vec4(p,1.);}'].join('\n'),
    cardFragment: ['precision mediump float; varying vec2 v_uv; uniform sampler2D u_image;', 'uniform vec4 u_crop; uniform float u_opacity; uniform float u_hover;', 'void main(){vec2 uv=u_crop.xy+vec2(v_uv.x,1.-v_uv.y)*u_crop.zw;', 'vec3 col=texture2D(u_image,uv).rgb;', 'float edge=min(min(v_uv.x,1.-v_uv.x),min(v_uv.y,1.-v_uv.y));', 'col=mix(col,col*.90+vec3(.055),1.-smoothstep(0.,.004,edge));', 'col+=pow(max(0.,1.-abs(v_uv.x-.73)*5.),8.)*u_hover*.07;', 'gl_FragColor=vec4(col,u_opacity);}'].join('\n'),
    markVertex: ['attribute vec3 a_position; attribute vec3 a_normal; uniform mat4 u_matrix; uniform mat4 u_model;', 'varying vec3 v_normal; varying vec3 v_position;', 'void main(){v_position=(u_model*vec4(a_position,1.)).xyz;v_normal=normalize((u_model*vec4(a_normal,0.)).xyz);gl_Position=u_matrix*vec4(a_position,1.);}'].join('\n'),
    markFragment: ['precision mediump float; varying vec3 v_normal; varying vec3 v_position;', 'uniform float u_time; uniform float u_opacity; uniform vec3 u_accent; uniform sampler2D u_image;', 'void main(){vec3 n=normalize(v_normal);vec3 eye=normalize(-v_position);vec3 r=reflect(-eye,n);', 'vec2 uv=r.xy*.5+.5+vec2(sin(r.y*4.+u_time*.19),cos(r.x*4.-u_time*.16))*.08;', 'vec3 reflection=texture2D(u_image,clamp(uv,0.,1.)).rgb;', 'float bands=pow(.5+.5*sin(r.y*9.+r.x*4.+u_time*.24),6.);', 'float fresnel=pow(1.-abs(dot(n,eye)),2.);', 'vec3 iridescent=.5+.5*cos(vec3(0.,2.,4.)+r.y*5.+u_time*.12);', 'vec3 col=vec3(.035)+reflection*.50+vec3(.75)*bands+iridescent*fresnel*.28+u_accent*.08;', 'gl_FragColor=vec4(col,u_opacity);}'].join('\n')
  };
  root.PortfolioShaders = shaders;
  if (typeof module !== 'undefined' && module.exports) module.exports = shaders;
})(typeof window !== 'undefined' ? window : globalThis);
