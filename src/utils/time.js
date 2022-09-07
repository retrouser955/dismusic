async function getMinute(sec) {
    if(sec < 60) return `0:${String(sec).length == 2 ? `${sec}` : `0${sec}`}`

    const minute = Math.floor(sec / 60)
    const newSecond = sec - minute * 60
    if(String(newSecond).length === 1 && String(newSecond).endsWith('0')) return `${minute}:${newSecond}0`
    if(String(newSecond).length === 2) return `${minute}:${newSecond}`
    return `${minute}:0${newSecond}`
}
module.exports = getMinute