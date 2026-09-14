import * as T from 'three';

// A bounded, soft presentation of the outgoing light. Twelve samples in one
// small mesh, no screen-sized blur and no idle animation. This is not photometry.
export function createLightVolume(length,width,{slope=1.15,reach=.065,name='wyjscie'}={}){
  const uniforms={lightColor:{value:new T.Color()},strength:{value:0},halfWidth:{value:width/2},reach:{value:reach},slope:{value:slope},span:{value:width+2*reach*slope},ray:{value:new T.Vector3()},curve:{value:0},length:{value:length}};
  const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false,
    vertexShader:`varying vec3 localPoint;
      #include <clipping_planes_pars_vertex>
      void main(){localPoint=position;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader:`uniform vec3 lightColor,ray;uniform float strength,halfWidth,reach,slope,span,curve,length;varying vec3 localPoint;
      #include <clipping_planes_pars_fragment>
      void main(){
        #include <clipping_planes_fragment>
        vec3 d=normalize(ray),p=localPoint+d*0.0001;
        vec3 safeD=mix(vec3(-1.0),vec3(1.0),step(vec3(0.0),d))*max(abs(d),vec3(0.00001));
        vec3 edge=mix(vec3(-0.5,0.0,-0.5),vec3(0.5,1.0,0.5),step(vec3(0.0),d));
        vec3 exits=(edge-p)/safeD;float travel=max(0.0,min(exits.x,min(exits.y,exits.z)));
        float sum=0.0;
        for(int i=0;i<12;i++){
          vec3 q=p+d*travel*(float(i)+0.5)/12.0;
          float h=q.y*reach-curve*pow(q.x*length,2.0)*0.5;
          float y=h/reach,spread=halfWidth+max(0.0,h)*slope;
          float crossFade=1.0-smoothstep(0.35,1.0,abs(q.z*span)/max(0.00001,spread));
          float endFade=1.0-smoothstep(0.36,0.5,abs(q.x));
          float fade=exp(-4.2*max(0.0,y))*(1.0-smoothstep(0.6,1.0,y));
          sum+=crossFade*endFade*fade*step(0.0,y);
        }
        float alpha=clamp(sum/12.0*min(travel*2.8,2.2)*strength,0.0,0.55);
        if(alpha<0.001)discard;gl_FragColor=vec4(lightColor,alpha);
        #include <colorspace_fragment>
      }`,clipping:true});
  const geometry=new T.BoxGeometry(1,1,1);geometry.translate(0,.5,0);
  const mesh=new T.Mesh(geometry,material);mesh.name='Poswiata_przestrzenna_'+name;mesh.visible=false;mesh.renderOrder=3;mesh.frustumCulled=false;
  const inverse=new T.Matrix4(),direction=new T.Vector3();
  mesh.onBeforeRender=(_renderer,_scene,camera)=>{inverse.copy(mesh.matrixWorld).invert();camera.getWorldDirection(direction);uniforms.ray.value.copy(direction).transformDirection(inverse);};
  function update(color,level,{night=false,power=10,transmission=1,coupling=1,curvature=0}={}){
    const amount=Math.max(0,level)*transmission*coupling;
    const distance=reach*(.42+.58*Math.sqrt(Math.max(0,level))),span=width+2*distance*slope;
    mesh.visible=amount>.002;uniforms.lightColor.value.copy(color);uniforms.strength.value=amount*(night?.85:.40)*Math.min(1.5,Math.sqrt(Math.max(1,power)/10));
    uniforms.reach.value=distance;uniforms.span.value=span;uniforms.curve.value=curvature;mesh.scale.set(length,distance,span);
    mesh.userData={outgoing:true,level:amount,reachMm:distance*1000,transmission,slope,presentationOnly:true};
  }
  update(new T.Color(),0);
  return{mesh,update,dispose(){geometry.dispose();material.dispose();}};
}
