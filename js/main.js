const video = document.getElementById("video");

async function loadFaceApiModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.ageGenderNet.loadFromUri('/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    ]);
}

async function startVideo() {
    const constraints = {
        video: {
            facingMode: "user",
            width: { min: 640, ideal: 1280, max: 1280 },
            height: { min: 480, ideal: 720, max: 720 }
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        console.error("Erro ao iniciar vídeo:", err);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();
        } catch (err) {
            console.error("Erro ao acessar a câmera:", err);
        }
    }
}

function createCanvas() {
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    document.body.append(canvas);
    return canvas;
}

function updateCanvasSize(canvas) {
    const displaySize = {
        width: video.clientWidth,
        height: video.clientHeight
    };
    canvas.style.width = `${displaySize.width}px`;
    canvas.style.height = `${displaySize.height}px`;
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);
    return displaySize;
}

function drawDetections(detections, ctx, displaySize) {
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    resizedDetections.forEach(detection => {
        faceapi.draw.drawFaceLandmarks(ctx.canvas, [detection]);
        const { box } = detection.detection;

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        const age = Math.round(detection.age);
        const gender = detection.gender;
        const emotion = Object.entries(detection.expressions)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
            
            const textX = box.x;
            const textY = box.y + box.height + 10; // Ajustado para ficar abaixo da caixa
            const padding = 4;
    
            // Desenhar fundo da caixa de informações
            const boxHeight = 40; // Altura da caixa
            const boxWidth = box.width; // Largura da caixa igual à largura do rosto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Cor de fundo
            ctx.fillRect(textX, textY, boxWidth, boxHeight);
    
            // Configurações de estilo de texto
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial'; // Tamanho da fonte
    
            // Desenhar informações na horizontal
            const infoY = textY + padding + 20; // Y para o texto
            ctx.fillText(`Idade: ${age}`, textX + padding, infoY);
            ctx.fillText(`Gênero: ${gender === "male" ? "homem" : "mulher"}`, textX + boxWidth / 3 + padding, infoY);
            ctx.fillText(`Emoção: ${emotion}`, textX + (2 * boxWidth) / 3 + padding, infoY);
    });
}

video.addEventListener("playing", async () => {
    await loadFaceApiModels();
    const canvas = createCanvas();
    let displaySize = updateCanvasSize(canvas);
    const ctx = canvas.getContext("2d");

    window.addEventListener('resize', () => {
        displaySize = updateCanvasSize(canvas);
    });

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()

        if (detections.length) {

            drawDetections(detections, ctx, displaySize);
        }
    }, 1000);
});

loadFaceApiModels().then(startVideo);
