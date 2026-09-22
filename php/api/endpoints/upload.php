<?php
/**
 * Pretty Puff — Image & Media Upload API Endpoints
 * Converted from server/routes/upload.ts
 */

declare(strict_types=1);

Auth::requireAuth();

$first = $routeSegments[0] ?? 'single';

function validate_and_save_upload(array $file, string $folder): array {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new \Exception('File upload error code: ' . $file['error']);
    }

    if ($file['size'] > UPLOAD_MAX_BYTES) {
        throw new \Exception('File exceeds maximum allowed size of 5 MB.');
    }

    // MIME type check
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, ALLOWED_MIMES, true)) {
        throw new \Exception('Invalid image format. Allowed formats: WebP, JPEG, PNG, GIF.');
    }

    // Extension check
    $origName = $file['name'];
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTENSIONS, true)) {
        throw new \Exception('Invalid file extension.');
    }

    // Clean filename
    $cleanBase = preg_replace('/[^a-z0-9]+/i', '-', pathinfo($origName, PATHINFO_FILENAME));
    $cleanBase = trim(substr($cleanBase, 0, 30), '-');
    if ($cleanBase === '') {
        $cleanBase = 'image';
    }

    $uniqueName = sprintf('%s-%d-%04d.%s', $cleanBase, time(), random_int(1000, 9999), $ext);

    // Target directory
    $safeFolder = in_array($folder, ['products', 'blog', 'banners', 'general'], true) ? $folder : 'general';
    $targetDir = UPLOAD_DIR . '/' . $safeFolder;

    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $targetPath = $targetDir . '/' . $uniqueName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new \Exception('Failed to save uploaded file to disk. Check folder write permissions.');
    }

    $relativeUrl = "/uploads/{$safeFolder}/{$uniqueName}";

    return [
        'url'      => $relativeUrl,
        'filename' => $uniqueName,
    ];
}

// POST /api/upload/single
if ($method === 'POST' && ($first === 'single' || empty($first))) {
    try {
        if (empty($_FILES['image'])) {
            json_error('No image file was provided.', 400);
        }

        $folder = $_GET['folder'] ?? $_POST['folder'] ?? 'general';
        $result = validate_and_save_upload($_FILES['image'], (string)$folder);

        json_success([
            'url'      => $result['url'],
            'filename' => $result['filename'],
        ], 'Image uploaded successfully.', [
            'url'      => $result['url'],
            'filename' => $result['filename'],
        ]);
    } catch (\Throwable $e) {
        json_error($e->getMessage(), 500);
    }
}

// POST /api/upload/multiple
if ($method === 'POST' && $first === 'multiple') {
    try {
        if (empty($_FILES['images']) || !is_array($_FILES['images']['name'])) {
            json_error('No images provided.', 400);
        }

        $folder = $_GET['folder'] ?? $_POST['folder'] ?? 'general';
        $urls = [];

        $fileCount = count($_FILES['images']['name']);
        for ($i = 0; $i < $fileCount; $i++) {
            $file = [
                'name'     => $_FILES['images']['name'][$i],
                'type'     => $_FILES['images']['type'][$i],
                'tmp_name' => $_FILES['images']['tmp_name'][$i],
                'error'    => $_FILES['images']['error'][$i],
                'size'     => $_FILES['images']['size'][$i],
            ];
            $saved = validate_and_save_upload($file, (string)$folder);
            $urls[] = $saved['url'];
        }

        json_success([
            'urls' => $urls,
        ], count($urls) . ' images uploaded successfully.', [
            'urls' => $urls,
        ]);
    } catch (\Throwable $e) {
        json_error($e->getMessage(), 500);
    }
}

json_error('Upload endpoint not found.', 404);
