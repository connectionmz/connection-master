import { AddAPhoto, VerifiedRounded } from "@mui/icons-material";
import GridPosts from "./GridPosts";

const Campaign = () => {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 max-w-sm mx-auto">
             <div className="flex items-center">
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAY1BMVEX///8AAAD4+Pjs7OzLy8vV1dWAgIDa2tpMTEzn5+ceHh6Hh4fd3d2hoaHz8/P8/PxiYmKoqKhpaWmampp1dXUYGBiwsLDExMRUVFQsLCwTExM+Pj66urpvb28LCwuNjY0zMzMOFsniAAAA2UlEQVRIie2S2RKDIAwAjXig1vustdD//8qKUhUFsdPHsm+QbCYJWJbBYDD8gnMxL3Vce3vObFXmFpQXJRJuaKWV7NYjdbO7bME9t/wSA3SHpATgrL+mgBEvOIYwhAopdaI7s/pYtoMB5OItxjDxGORlWWxfEA1PMluQqeaPWZQK/dEXfIgko3HmyuXSX7dIUEtH47g8qffyhmZktZSjcUqQU2ie1vKkWoQ02vjbjlaYp1ptekUR3F6wGKL29C9q4wdeLUL1o21A1dwi1e1RQhIk30sGg+FPeQOwhQdDf2OfWwAAAABJRU5ErkJggg==''"
            className="w-8 h-8 mr-2"
          style={{border:'1px solid #CCC', padding:'6px', borderRadius:'50px'}}/>
          <span className="text-sm font-medium">Nike<VerifiedRounded style={{color:'green'}}/></span>
        </div>
            <div className="flex items-center justify-center h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img 
                    src='https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/f6bfb2c064a64c498e57af1700593332_9366/Stan_Smith_Lux_Shoes_White_HQ6785_HM1.jpg' 
                    alt="Challenge" 
                    className="object-cover h-full w-full"
                />
            </div>
            <div className="text-center text-lg font-semibold text-gray-800 mb-4">
              A foto com maior numero de likes em 24horas ganha <span className="text-red">25%</span>de desconto neste artigo
            </div>
            <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg w-full hover:bg-blue-600 transition duration-300">
               <AddAPhoto/>
            </button>
            <GridPosts campaign={''}/>
        </div>
    );
}
export default Campaign;
