const video = document.getElementById('video')

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
]).then(startWebcam).then(faceRecognition)

function startWebcam() {
  navigator.mediaDevices.getUserMedia(
    {
        'video': true,
        audio: false
    })
    .then(stream => video.srcObject = stream)
    .catch(err => console.log(err))
}

function getLabeledFaceDescriptions(){

    const labels = ["Hau","Toan","Thay_Thai_Anh","Ho_Chi_Minh","Obama","DonaldTrump"]
    return Promise.all(
        labels.map(async (label) => {
            descriptions = []
    
            for (i=1;i<=2;i++){
                const image = await faceapi.fetcImage(`./labels/${label}/${i}.jpg`)
                
                const detections = await faceapi
                    .detectSingleFace(image)
                    .withFaceLandmarks()
                    .withFaceDescriptor()
                
                descriptions.push(detections.descriptor)
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}
async function faceRecognition(){
    const labeledFaceDescriptors = await getLabeledFaceDescriptions()
    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors)

    video.addEventListener('play', ()=>{
        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)
        
        const displaySize = { width: video.width, height: video.height }

        faceapi.matchDimensions(canvas, dislaySize)

        setInterval(async ()=> {
            const detections = await faceapi
                .detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptor()

            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            canvas.getCotext('2d').clearRect(0, 0, canvas.width, canvas.height)

            const results = resizedDetections.map((d)=>{
                return faceMatcher.findBestMatch(d.descriptor)
            })

            results.forEach((result, i)=>{
                const box = resizedDetections[i].detections.box
                const drawBox = new faceapi.draw.drawBox(box, {label: result})
                
                drawBox.draw(canvas)
            })
        },100)
    })
}
startWebcam()