from scalar_api_reference import (
    DocumentDownloadType,
    Layout,
    SearchHotKey,
    Theme,
)


class TestLayout:
    def test_layout_enum_values(self):
        assert Layout.MODERN.value == "modern"
        assert Layout.CLASSIC.value == "classic"


class TestSearchHotKey:
    def test_search_hot_key_enum_values(self):
        assert SearchHotKey.K.value == "k"
        assert SearchHotKey.A.value == "a"
        assert SearchHotKey.Z.value == "z"
        assert SearchHotKey.S.value == "s"

    def test_all_alphabet_letters(self):
        alphabet = "abcdefghijklmnopqrstuvwxyz"
        for letter in alphabet:
            assert hasattr(SearchHotKey, letter.upper())
            assert getattr(SearchHotKey, letter.upper()).value == letter


class TestTheme:
    def test_theme_enum_values(self):
        assert Theme.DEFAULT.value == "default"
        assert Theme.ALTERNATE.value == "alternate"
        assert Theme.MOON.value == "moon"
        assert Theme.PURPLE.value == "purple"
        assert Theme.SOLARIZED.value == "solarized"
        assert Theme.BLUE_PLANET.value == "bluePlanet"
        assert Theme.SATURN.value == "saturn"
        assert Theme.KEPLER.value == "kepler"
        assert Theme.ELYSIAJS.value == "elysiajs"
        assert Theme.FASTIFY.value == "fastify"
        assert Theme.MARS.value == "mars"
        assert Theme.DEEP_SPACE.value == "deepSpace"
        assert Theme.LASERWAVE.value == "laserwave"
        assert Theme.NONE.value == "none"

    def test_theme_enum_all_values(self):
        theme_values = [theme.value for theme in Theme]
        assert len(theme_values) == len(set(theme_values))
        assert len(theme_values) == 14
        for value in theme_values:
            assert isinstance(value, str)
            assert len(value) > 0


class TestDocumentDownloadType:
    def test_document_download_type_enum_values(self):
        assert DocumentDownloadType.JSON.value == "json"
        assert DocumentDownloadType.YAML.value == "yaml"
        assert DocumentDownloadType.BOTH.value == "both"
        assert DocumentDownloadType.DIRECT.value == "direct"
        assert DocumentDownloadType.NONE.value == "none"
