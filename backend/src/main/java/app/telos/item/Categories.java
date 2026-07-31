package app.telos.item;

import app.telos.item.dto.CategoryDto;

import java.util.List;

/** Static listing categories. Mirrors the frontend CATEGORIES export. */
public final class Categories {

    private Categories() {}

    public static final List<CategoryDto> ALL = List.of(
            new CategoryDto("tools", "Power Tools", "\uD83D\uDD27"),
            new CategoryDto("electronics", "Electronics", "\uD83D\uDCBB"),
            new CategoryDto("outdoor", "Outdoor & Garden", "\uD83C\uDFD5\uFE0F"),
            new CategoryDto("books", "Books & Media", "\uD83D\uDCDA"),
            new CategoryDto("kitchen", "Kitchen", "\uD83C\uDF73"),
            new CategoryDto("sports", "Sports", "\uD83D\uDEB2"),
            new CategoryDto("party", "Party & Events", "\uD83C\uDF89"),
            new CategoryDto("baby", "Baby & Kids", "\uD83E\uDDF8")
    );
}
