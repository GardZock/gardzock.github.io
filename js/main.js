const video = document.getElementById("video");

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ageGenderNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(startVideo);

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
            }
        });
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        console.error("Erro na primeira tentativa:", err);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
            video.srcObject = stream;
            await video.play();
        } catch (err) {
            console.error("Erro ao iniciar vídeo:", err);
        }
    }
}

video.addEventListener("playing", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    document.body.append(canvas);

    function updateCanvasSize() {
        const displaySize = {
            width: video.clientWidth,
            height: video.clientHeight
        };
        canvas.style.width = displaySize.width + 'px';
        canvas.style.height = displaySize.height + 'px';
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        faceapi.matchDimensions(canvas, displaySize);
        return displaySize;
    }

    let displaySize = updateCanvasSize();

    window.addEventListener('resize', () => {
        displaySize = updateCanvasSize();
    });

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach(detection => {
            faceapi.draw.drawFaceLandmarks(canvas, [detection]);

            const box = detection.detection.box;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.textBaseline = 'top';

            const age = Math.round(detection.age);
            const gender = detection.gender;
            const emotion = Object.entries(detection.expressions)
                .reduce((a, b) => a[1] > b[1] ? a : b)[0];

            const lineHeight = 20;
            const padding = 4;
            const textX = box.x;
            const textY = box.y - (lineHeight * 3 + padding * 2);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                textX,
                Math.max(0, textY),
                Math.max(
                    ctx.measureText(`Age: ${age}`).width,
                    ctx.measureText(`Gender: ${gender}`).width,
                    ctx.measureText(`Emotion: ${emotion}`).width
                ) + padding * 2,
                lineHeight * 3 + padding * 2
            );

            // Desenha os textos
            ctx.fillStyle = 'white';
            ctx.fillText(`Age: ${age}`, textX + padding, Math.max(0, textY) + padding);
            ctx.fillText(`Gender: ${gender}`, textX + padding, Math.max(0, textY) + lineHeight + padding);
            ctx.fillText(`Emotion: ${emotion}`, textX + padding, Math.max(0, textY) + lineHeight * 2 + padding);
        });
    }, 100);
});