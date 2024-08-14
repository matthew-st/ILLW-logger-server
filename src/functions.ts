export function chunk(array: Array<any>, size: number) {
    const chunkedArray = []
    for (var i = 0; i < array.length; i += size) {
        chunkedArray.push(array.slice(i, i + size))
    }
    if (chunkedArray.length == 0) {
        chunkedArray.push([])
    }
    return chunkedArray
}
