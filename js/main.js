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
    const stream = await navigator.mediaDevices.getUserMedia(
        { video: true }
    );
    video.srcObject = stream;
    video.play();
}

video.addEventListener("playing", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // Alterado para detectAllFaces para detectar múltiplas faces
        const detections = await faceapi.detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Para cada face detectada
        resizedDetections.forEach(detection => {
            // Desenha a caixa de detecção
            const box = detection.detection.box;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Configura o estilo do texto
            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.textBaseline = 'top';

            // Prepara as informações
            const age = Math.round(detection.age);
            const gender = detection.gender;
            const emotion = Object.entries(detection.expressions)
                .reduce((a, b) => a[1] > b[1] ? a : b)[0];

            // Cria um fundo escuro para o texto
            const lineHeight = 20;
            const padding = 4;
            const textX = box.x;
            const textY = box.bottom + 5;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                textX, 
                textY, 
                Math.max(
                    ctx.measureText(`Age: ${age}`).width,
                    ctx.measureText(`Gender: ${gender}`).width,
                    ctx.measureText(`Emotion: ${emotion}`).width
                ) + padding * 2,
                lineHeight * 3 + padding * 2
            );

            // Desenha os textos
            ctx.fillStyle = 'white';
            ctx.fillText(`Age: ${age}`, textX + padding, textY + padding);
            ctx.fillText(`Gender: ${gender}`, textX + padding, textY + lineHeight + padding);
            ctx.fillText(`Emotion: ${emotion}`, textX + padding, textY + lineHeight * 2 + padding);
        });
    }, 100);
});