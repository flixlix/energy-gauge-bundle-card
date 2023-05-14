interface RegisterCardParams {
    type: string;
    name: string;
    description: string;
}
export function registerCustomCard(params: RegisterCardParams) {
    const windowWithCards = window as unknown as Window & {
        customCards: unknown[];
    };
    windowWithCards.customCards = windowWithCards.customCards || [];

    windowWithCards.customCards.push({
        ...params,
        preview: true,
        documentationURL: `https://github.com/flixlix/energy-gauge-bundle-card`,
    });
}
