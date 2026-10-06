<?php

declare(strict_types=1);

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Pembersih HTML dari editor teks perangkat ajar. Hanya tag format dasar
 * (paragraf, tebal/miring/garis bawah, daftar, tabel) yang dipertahankan;
 * semua atribut dibuang, sehingga tidak ada script, event handler, link,
 * atau style yang bisa disisipkan.
 */
class HtmlAman
{
    private const TAG = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ol', 'ul', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];

    /** Tag yang isinya dibuang seluruhnya (bukan hanya tag-nya). */
    private const BUANG_ISI = ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'noscript', 'head', 'title'];

    /** Apakah teks berupa HTML dari editor (bukan teks biasa dari data lama). */
    public static function adalahHtml(?string $teks): bool
    {
        return (bool) preg_match('/<(p|br|ol|ul|li|table|b|strong|i|em|u|div)\b[^>]*>/i', (string) $teks);
    }

    public static function bersihkan(?string $html): string
    {
        $html = trim((string) $html);
        if ($html === '') {
            return '';
        }
        if (! self::adalahHtml($html)) {
            // Teks biasa: di-escape (setelah di-decode supaya tidak menumpuk
            // &amp;amp; bila dibersihkan berulang) dan dibungkus paragraf,
            // sehingga hasilnya selalu HTML dan pembersihan bersifat idempoten.
            return '<p>'.nl2br(e(html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8')), false).'</p>';
        }

        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8"?><div id="akar">'.$html.'</div>', LIBXML_NONET);
        libxml_clear_errors();

        $akar = $dom->getElementById('akar');
        if (! $akar) {
            return '';
        }
        self::saring($akar);
        self::buangTepiKosong($akar);

        $hasil = '';
        foreach ($akar->childNodes as $anak) {
            $hasil .= $dom->saveHTML($anak);
        }

        return trim($hasil);
    }

    /** Buang paragraf/baris kosong di awal dan akhir (sisa tombol Enter). */
    private static function buangTepiKosong(DOMNode $akar): void
    {
        foreach (['firstChild', 'lastChild'] as $ujung) {
            while ($n = $akar->{$ujung}) {
                $teks = trim(str_replace("\u{a0}", '', $n->textContent));
                $kosong = $n instanceof DOMElement
                    ? in_array(strtolower($n->tagName), ['p', 'br'], true) && $teks === '' && $n->getElementsByTagName('table')->length === 0
                    : $n->nodeType === XML_TEXT_NODE && $teks === '';
                if (! $kosong) {
                    break;
                }
                $akar->removeChild($n);
            }
        }
    }

    private static function saring(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $anak) {
            if ($anak instanceof DOMElement) {
                $tag = strtolower($anak->tagName);
                if (in_array($tag, self::BUANG_ISI, true)) {
                    $node->removeChild($anak);

                    continue;
                }
                self::saring($anak);
                if (in_array($tag, self::TAG, true)) {
                    while ($anak->attributes->length > 0) {
                        $anak->removeAttributeNode($anak->attributes->item(0));
                    }
                } else {
                    // Tag lain (div, span, a, img, ...) dilepas, isinya tetap.
                    if ($tag === 'div') {
                        $p = $node->ownerDocument->createElement('p');
                        while ($anak->firstChild) {
                            $p->appendChild($anak->firstChild);
                        }
                        $node->replaceChild($p, $anak);
                    } else {
                        while ($anak->firstChild) {
                            $node->insertBefore($anak->firstChild, $anak);
                        }
                        $node->removeChild($anak);
                    }
                }
            } elseif ($anak->nodeType === XML_COMMENT_NODE || $anak->nodeType === XML_PI_NODE) {
                $node->removeChild($anak);
            }
        }
    }

    /**
     * HTML yang sudah dibersihkan -> XHTML (tag tertutup, mis. <br/>), format
     * yang dibutuhkan PhpWord\Shared\Html::addHtml (memakai parser XML).
     */
    public static function keXhtml(string $html): string
    {
        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8"?><div id="akar">'.self::bersihkan($html).'</div>', LIBXML_NONET);
        libxml_clear_errors();

        $akar = $dom->getElementById('akar');
        $hasil = '';
        foreach ($akar ? $akar->childNodes : [] as $anak) {
            $hasil .= $dom->saveXML($anak);
        }

        return $hasil;
    }

    /** Ubah teks/HTML menjadi teks polos (untuk pemeriksaan "sudah diisi"). */
    public static function teksPolos(?string $html): string
    {
        return trim(html_entity_decode(strip_tags(str_replace(['<br>', '</p>', '</li>'], ' ', (string) $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
}
