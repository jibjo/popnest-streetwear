#!/usr/bin/env python3
"""
HEAVENLY.CO — static page assembler for the design preview.
Reads partials + page bodies from store/src/ and writes finished HTML pages
into store/. Edit files in store/src/, then run:

    python3 tools/build.py

(The committed store/*.html files are build outputs — regenerating them keeps
the header/footer/SEO meta identical across all pages, exactly like Shopify
layout/theme.liquid does in production.)
"""
import pathlib, re

SRC = pathlib.Path(__file__).resolve().parent.parent / "store" / "src"
OUT = SRC.parent
SITE_URL = "https://heavenly.co"          # ← production domain placeholder
DEFAULT_OG = f"{SITE_URL}/assets/img/hero-exterior.jpg"

PAGES = {
    # path:            (title, meta description, og_image, extra_schema_key)
    "index.html": (
        "Heavenly.co — Modern Lighting & Home Décor",
        "Thoughtfully designed lighting and home décor. Shop the Arden outdoor wall sconce, pendants, chandeliers, mirrors and rugs — free shipping on qualifying orders.",
        None, "index"),
    "shop.html": (
        "Shop All — Lighting & Home Décor | Heavenly.co",
        "Browse the full Heavenly collection: outdoor wall sconces, pendants, chandeliers, lamps, mirrors, rugs and accessories. Filter by category, price, colour and availability.",
        None, None),
    "product.html": (
        "Arden Modern Outdoor Wall Sconce | Heavenly.co",
        "A slim architectural wall sconce with warm up-down light. IP65 outdoor-rated aluminum, integrated LED, 3000K. Free shipping on qualifying orders.",
        f"{SITE_URL}/assets/img/product-arden-glow.jpg", None),
    "collections.html": (
        "Collections — Shop by Category | Heavenly.co",
        "Shop Heavenly by category: outdoor lighting, wall sconces, pendants, chandeliers, lamps, mirrors, rugs and home accessories.",
        None, None),
    "cart.html": (
        "Your Bag | Heavenly.co",
        "Review your bag, estimate shipping and check out securely.",
        None, None),
    "checkout.html": (
        "Checkout | Heavenly.co",
        "Secure checkout — address, shipping method and order summary.",
        None, None),
    "wishlist.html": (
        "Wishlist | Heavenly.co",
        "Products you've saved for later at Heavenly.co.",
        None, None),
    "track-order.html": (
        "Track Your Order | Heavenly.co",
        "Enter your order number and email — or a tracking number — to follow your Heavenly order.",
        None, None),
    "about.html": (
        "About Heavenly — Design-First Lighting & Décor | Heavenly.co",
        "Heavenly is an independent home décor brand focused on thoughtful design, honest quality and rooms that feel like home. Read our story.",
        None, None),
    "contact.html": (
        "Contact Us | Heavenly.co",
        "Questions about an order, a product or your space? Email support@heavenly.co or send a message — we reply within one business day.",
        None, None),
    "faq.html": (
        "FAQ — Shipping, Returns, Specs & More | Heavenly.co",
        "Answers about shipping, delivery, returns, installation, IP ratings, lighting specs, payment, tracking, international orders and warranty.",
        None, "faq"),
    "shipping-policy.html": (
        "Shipping Policy | Heavenly.co",
        "Processing times, delivery estimates, destinations, costs, duties and tracking — how Heavenly gets your order home.",
        None, None),
    "returns-refunds.html": (
        "Returns & Refunds | Heavenly.co",
        "Eligibility, return windows, condition requirements, damaged-item support and refund processing — explained clearly.",
        None, None),
    "privacy-policy.html": (
        "Privacy Policy | Heavenly.co",
        "What information Heavenly collects, why, how it's shared, and the choices and rights you have.",
        None, None),
    "terms-conditions.html": (
        "Terms & Conditions | Heavenly.co",
        "The terms that govern your use of Heavenly.co and purchases made through it.",
        None, None),
    "cookie-policy.html": (
        "Cookie Policy | Heavenly.co",
        "The cookies Heavenly uses, why we use them, and how to control them.",
        None, None),
    "accessibility.html": (
        "Accessibility | Heavenly.co",
        "Our commitment to an accessible store — and how to tell us when we get it wrong.",
        None, None),
    "blog/index.html": (
        "The Heavenly Journal — Lighting & Décor Ideas",
        "Original guides on outdoor lighting, choosing sconces, bedroom and living-room light, and modern home styling.",
        None, "blog"),
    "blog/outdoor-lighting-ideas.html": (
        "9 Outdoor Lighting Ideas for a Warm, Welcoming Home | Heavenly Journal",
        "Layered, practical ideas for lighting entries, patios and garden walls — plus how to pick fixtures that last outdoors.",
        f"{SITE_URL}/assets/img/product-arden-entry.jpg", None),
    "blog/how-to-choose-a-wall-sconce.html": (
        "How to Choose a Wall Sconce (Room by Room) | Heavenly Journal",
        "Size, placement, beam direction and IP ratings — a plain-English guide to choosing wall sconces for every room, indoors and out.",
        f"{SITE_URL}/assets/img/product-arden-glow.jpg", None),
    "blog/bedroom-lighting-guide.html": (
        "A Calmer Bedroom: a Layered Lighting Guide | Heavenly Journal",
        "How three light layers — ambient, task and accent — turn a bedroom into the calmest room in the house.",
        f"{SITE_URL}/assets/img/product-aurora.jpg", None),
    "404.html": (
        "Page Not Found | Heavenly.co",
        "The page you're looking for doesn't exist. Explore lighting and décor instead.",
        None, None),
}

EXTRA_SCHEMAS = {
    "faq": lambda: faq_schema(),
    "index": lambda: breadcrumbs([["Home", SITE_URL]]),
    "blog": lambda: breadcrumbs([["Home", SITE_URL], ["Journal", f"{SITE_URL}/blog"]]),
}


def breadcrumbs(items):
    import json
    return ("<script type='application/ld+json'>" + json.dumps({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
            for i, (n, u) in enumerate(items)
        ]}) + "</script>")


def faq_schema():
    import json
    faqs = [
        ("How long does shipping take?", "Orders are prepared in [PROCESSING TIME]. Delivery typically takes 3–7 business days for domestic orders and 5–16 business days internationally, depending on destination. Live estimates appear at checkout."),
        ("What is your return policy?", "Eligible items can be returned within the return window shown at checkout and in our Returns & Refunds policy. Items must be in original condition and packaging."),
        ("What does IP65 mean?", "IP65-rated fixtures are dust-tight and protected against water jets — suitable for covered and exposed outdoor walls in normal weather conditions."),
        ("Do your outdoor lights need bulbs?", "Our flagship Arden and Strata sconces use integrated LED modules rated for roughly 30,000 hours — no bulbs to buy or change."),
        ("Can I install the sconce myself?", "Our sconces hardwire to a standard junction box. A confident DIYer can install them with the power off; we recommend a licensed electrician."),
        ("Do you ship internationally?", "Yes — we ship to most countries. Duties and taxes for international orders are the recipient's responsibility unless stated otherwise at checkout."),
        ("Is checkout secure?", "Yes. Checkout is encrypted with HTTPS/TLS and payments are processed by our payment provider. Card details never touch our servers."),
        ("Do products come with a warranty?", "Lighting carries a 2-year limited warranty against manufacturing defects. Full terms are listed on each product page."),
    ]
    return ("<script type='application/ld+json'>" + json.dumps({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in faqs
        ]}) + "</script>")


def render(path):
    title, desc, og, schema_key = PAGES[path]
    root = "../" if path.startswith("blog/") else ""
    canonical = f"{SITE_URL}/{path}"
    html = (SRC / "partials" / "head.html").read_text()
    html += (SRC / "partials" / "header.html").read_text()
    html += (SRC / "pages" / path).read_text()
    html += (SRC / "partials" / "footer.html").read_text()
    schema = ""
    if schema_key and schema_key in EXTRA_SCHEMAS:
        schema = EXTRA_SCHEMAS[schema_key]()
    # Breadcrumb schema for all inner pages
    if not schema and path != "index.html":
        parts = path.replace(".html", "").split("/")
        crumbs = [["Home", SITE_URL]]
        acc = ""
        for p in parts[:-1]:
            acc += p + "/"
            crumbs.append([p.capitalize(), f"{SITE_URL}/{acc}"])
        name = re.sub(r"[-/]", " ", path.replace('.html', '').split("/")[-1]).title()
        crumbs.append([name, canonical])
        schema = breadcrumbs(crumbs)

    html = (html
            .replace("{{TITLE}}", title)
            .replace("{{DESCRIPTION}}", desc)
            .replace("{{CANONICAL}}", canonical)
            .replace("{{OG_TYPE}}", "website")
            .replace("{{OG_IMAGE}}", og or DEFAULT_OG)
            .replace("{{ROOT}}", root)
            .replace("{{SITE_URL}}", SITE_URL)
            .replace("{{EXTRA_SCHEMA}}", schema))

    # Blog posts live one folder deep — rebase their site links to ../
    if root:
        html = re.sub(r'href="((?:index|shop|product|collections|cart|checkout|wishlist|track-order|about|contact|faq|shipping-policy|returns-refunds|privacy-policy|terms-conditions|cookie-policy|accessibility|404)(?:\.html[^"]*)?)"',
                      rf'href="{root}\1"', html)
        html = html.replace('href="' + root + 'blog/', 'href="')  # same-folder blog links stay put
    return html


def main():
    count = 0
    for path in PAGES:
        out_file = OUT / path
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(render(path))
        count += 1
    print(f"Built {count} pages → {OUT}")


if __name__ == "__main__":
    main()
