const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const info = document.getElementById('info');

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadModel() {
    const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
    return model;
}

async function detectFaces(model) {
    const predictions = await model.estimateFaces({ input: video });
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (predictions.length > 0) {
        predictions.forEach(prediction => {
            const topLeft = prediction.boundingBox.topLeft;
            const bottomRight = prediction.boundingBox.bottomRight;
            context.strokeStyle = 'red';
            context.strokeRect(topLeft[0], topLeft[1], 
                               bottomRight[0] - topLeft[0], 
                               bottomRight[1] - topLeft[1]);
            // Aqui você pode adicionar lógica para estimar idade e gênero
            info.innerHTML = `Idade: estimativa, Gênero: estimativa`;
        });
    }

    requestAnimationFrame(() => detectFaces(model));
}

async function main() {
    await setupCamera();
    const model = await loadModel();
    detectFaces(model);
}

main();