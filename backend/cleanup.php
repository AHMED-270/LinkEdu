<?php
$content = file_get_contents('config/school_options.php');

$replacements = [
    "'Sciences Experimentales - SVT (Francais)'" => "'Sciences Experimentales - SVT'",
    "'Sciences Experimentales - Physique-Chimie (Francais)'" => "'Sciences Experimentales - Physique-Chimie'",
    "'Sciences Mathematiques A (Francais)'" => "'Sciences Mathematiques A'",
    "'Sciences Mathematiques B (Francais)'" => "'Sciences Mathematiques B'",
    "'Sciences et Technologies Electrique (Francais)'" => "'Sciences et Technologies Electrique'",
    "'Sciences et Technologies Mecanique (Francais)'" => "'Sciences et Technologies Mecanique'",
    
    // College config
    "'1ac' => [\n            'General (Francais)' => [" => "'1ac' => [\n            'General' => [",
    "'2ac' => [\n            'General (Francais)' => [" => "'2ac' => [\n            'General' => [",
    "'3ac' => [\n            'General (Francais)' => [" => "'3ac' => [\n            'General' => [",
    "'1ac' => ['General (Francais)', 'General (Arabe)']," => "'1ac' => ['General'],",
    "'2ac' => ['General (Francais)', 'General (Arabe)']," => "'2ac' => ['General'],",
    "'3ac' => ['General (Francais)', 'General (Arabe)']," => "'3ac' => ['General'],",
    "'1ac' => ['General (Francais)' => 1600, 'General (Arabe)' => 1600]," => "'1ac' => ['General' => 1600],",
    "'2ac' => ['General (Francais)' => 1700, 'General (Arabe)' => 1700]," => "'2ac' => ['General' => 1700],",
    "'3ac' => ['General (Francais)' => 1800, 'General (Arabe)' => 1800]," => "'3ac' => ['General' => 1800],"
];

$content = str_replace(array_keys($replacements), array_values($replacements), $content);

$lines = explode("\n", $content);
$filtered = [];
$skipBlock = false;
foreach ($lines as $line) {
    // If it's a key block starting with '(Arabe)'
    if (strpos($line, "(Arabe)' => [") !== false) {
        $skipBlock = true;
        continue;
    }
    // End of block
    if ($skipBlock && trim($line) === "],") {
        $skipBlock = false;
        continue;
    }
    if ($skipBlock) continue;
    
    // Single line items containing '(Arabe)'
    if (strpos($line, "(Arabe)") !== false) continue;
    
    $filtered[] = $line;
}

file_put_contents('config/school_options.php', implode("\n", $filtered));
echo "Success";
