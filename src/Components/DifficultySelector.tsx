import React, { useState } from 'react';
import { AppSessionData } from './AppData';

const difficultyRatings = [4, 3, 2, 1];

export const DifficultySelector: React.FC = () => {
    const [selectedRatings, setSelectedRatings] = useState<number[]>(() => {
        const storedRatings = AppSessionData.prop('PlCfg_SelectedDfcltyRatings');
        return Array.isArray(storedRatings) ? storedRatings : [];
    });

    const toggleRating = (rating: number) => {
        const newSelectedRatings = selectedRatings.includes(rating)
            ? selectedRatings.filter((selectedRating) => selectedRating !== rating)
            : [...selectedRatings, rating];

        setSelectedRatings(newSelectedRatings);
        AppSessionData.prop('PlCfg_SelectedDfcltyRatings', newSelectedRatings);
    };

    return (
        <div className="difficulty-editor">
            <div className="difficulty-editor__image"></div>
            <div className="difficulty-editor__buttons">
                {difficultyRatings.map((rating) => {
                    const isSelected = selectedRatings.includes(rating);

                    return (
                        <button
                            key={rating}
                            type="button"
                            className={`difficulty-editor__button ${
                                isSelected ? 'difficulty-editor__button--selected' : ''
                            }`}
                            onClick={() => toggleRating(rating)}
                            aria-pressed={isSelected}
                        >
                            {rating}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
