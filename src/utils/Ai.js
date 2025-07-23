class AiTextGenerator {
    constructor() {
        this.apiKey = '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';
        this.model = "mistralai/mistral-7b-instruct:free";
        this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
    }

    async generateAIContent(type, leadData, form, setIsGenerating, isGenerating) {
        try {
            setIsGenerating({ ...isGenerating, [type]: true });

            if (!leadData) {
                message.error('Please select a lead first to generate AI content');
            }

            const leadTitle = leadData.leadTitle || "Untitled Lead";
            const leadValue = leadData.leadValue || 0;

            let prompt = "";

            if (type === "description") {
                prompt = `Write a brief and concise description for a business proposal titled "${leadTitle}" with an estimated value of ${leadValue}. Keep it informative and persuasive, but limit to maximum 100-150 words.`;
            } else if (type === "terms") {
                prompt = `Generate brief Terms & Conditions for a business proposal titled "${leadTitle}" with an estimated value of ${leadValue}. Include only essential points about payment terms, delivery timeline, and confidentiality. Make it legally sound but easy to understand. Keep it under 150 words.`;
            } else if (type === "notes") {
                prompt = `Create short additional notes for a business proposal titled "${leadTitle}" with an estimated value of ${leadValue}. Include only 3-4 key points that would be valuable for the client to know. Keep it under 100 words.`;
            } else {
                throw new Error("Invalid text type. Use 'description', 'terms', or 'notes'.");
            }

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "CRM Proposal Generator"
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.message) {
                    message.error(errorData.error.message);
                } else {
                    message.error(`API Error: ${response.status} - ${response.statusText}`);
                }
            }

            const data = await response.json();
            const generatedText = data.choices[0].message.content;

            form.setFieldsValue({ [type]: generatedText });

            const textareaId = `${type}-textarea`;
            const textarea = document.getElementById(textareaId);

            if (textarea) {
                textarea.value = generatedText;

                const originalBackground = textarea.style.backgroundColor;
                textarea.style.backgroundColor = '#e6f7ff';
                setTimeout(() => {
                    textarea.style.backgroundColor = originalBackground;
                }, 500);

                try {
                    const event = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(event);
                } catch (e) {
                }
            } else {
                const textareaByName = document.querySelector(`[data-name="${type}"]`);
                if (textareaByName) {
                    textareaByName.value = generatedText;

                    try {
                        const event = new Event('input', { bubbles: true });
                        textareaByName.dispatchEvent(event);
                    } catch (e) {
                    }
                }
            }

            setTimeout(() => {
                form.setFieldsValue({ [type]: generatedText });
            }, 100);

            return {
                success: true,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`,
                text: generatedText
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to create ${type}: ${error.message}`,
                error: error
            };
        } finally {
            setIsGenerating({ ...isGenerating, [type]: false });
        }
    }
}

export default AiTextGenerator; 