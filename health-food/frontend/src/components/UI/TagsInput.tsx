import { useState, type KeyboardEvent } from 'react';

interface TagsInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
}

const TagsInput = ({ tags = [], setTags }: TagsInputProps) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="tags-input-container">
            {tags.map((tag, index) => (
                <span key={index} className="tag">
                    {tag}
                    <button type="button" className="remove-tag" onClick={() => removeTag(tag)}>
                        &times;
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "Добавьте и нажмите Enter..." : ""}
            />
        </div>
    );
};

export default TagsInput; 