import { CanvasRenderingContext2D } from "canvas";

export default function wrapText (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    let words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineArray = [];

    for(var n = 0; n < words.length; n++) {
        testLine += `${words[n]} `;
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lineArray.push([line, x, y]);
            y += lineHeight;
            line = `${words[n]} `;
            testLine = `${words[n]} `;
        }
        else {
            line += `${words[n]} `;
        }
        if(n === words.length - 1) {
            lineArray.push([line, x, y]);
        }
    }
    return lineArray;
}