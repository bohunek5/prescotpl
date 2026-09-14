import * as T from 'three';
export function makeStudioEnvironment(){
  const env=new T.Scene();env.background=new T.Color('#77797a');
  const card=(w,h,p,target,intensity)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color().setScalar(intensity),side:T.DoubleSide}));m.position.set(...p);m.lookAt(...target);env.add(m);};
  card(6,3,[0,4,0],[0,0,0],3);
  card(1.8,5,[-3,1.3,2],[0,0,0],5);
  card(1,6,[3,0,1],[0,0,0],3);
  card(6,.6,[0,-1,-3],[0,0,0],.25);
  card(6,3,[0,0,4],[0,0,0],.85);
  return env;
}
