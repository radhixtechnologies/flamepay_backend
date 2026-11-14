<?php
// FlamePay Auto-Fix File Path Slashes for Linux Hostinger
$dir = __DIR__;
$files = scandir($dir);
$count = 0;

foreach ($files as $f) {
    if (strpos($f, '\\') !== false) {
        $cleanPath = str_replace('\\', '/', $f);
        $targetDir = dirname($dir . '/' . $cleanPath);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        if (rename($dir . '/' . $f, $dir . '/' . $cleanPath)) {
            echo "Moved: " . htmlspecialchars($f) . " -> " . htmlspecialchars($cleanPath) . "<br>";
            $count++;
        }
    }
}

echo "<h2>Done! Fixed $count files into proper Linux folders.</h2>";
echo "<p><a href='/'>Click here to open FlamePay Landing Page</a></p>";
@unlink(__FILE__);
?>
