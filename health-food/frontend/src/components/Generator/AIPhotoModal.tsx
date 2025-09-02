import Modal from "../UI/Modal";
import { UploadCloud, Trash2, Check, X, LoaderCircle } from "lucide-react";
import Button from "../UI/Button";
import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
    setAIPhotoModalOpen,
    setLastDetectedProducts,
    generateRecipe,
    setPlanItem,
    setCurrentMeal,
} from "../../store/slices/appSlice";
import { analyzePhoto } from "../../api";
import type { RootState } from "../../store";
import type { PlanItem } from "../../store/slices/appSlice";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import RecipeCard from "../UI/RecipeCard";

const steps = ["Загрузка", "Подтверждение", "Продукты", "Сложность", "Результат"];

const difficultyOptions: { [key: string]: string } = {
    легкий: "Быстрые рецепты до 20 минут, минимум ингредиентов.",
    средний: "Сбалансированные рецепты с интересными сочетаниями.",
    сложный: "Изысканные блюда для тех, кто любит готовить.",
};

export const AIPhotoModal = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [detectedItems, setDetectedItems] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [difficulty, setDifficulty] = useState<'легкий' | 'средний' | 'сложный'>('средний');
    const [currentStep, setCurrentStep] = useState(0); // 0: upload, 1: preview, 2: products, 3: difficulty, 4: result
    const dispatch = useAppDispatch();

    const isOpen = useAppSelector((state: RootState) => state.app.isAIPhotoModalOpen);
    const biomarkers = useAppSelector((state: RootState) => state.app.biomarkers);
    const preferences = useAppSelector((state: RootState) => state.app.preferences);
    const generationStatus = useAppSelector((state: RootState) => state.app.aiGenerationStatus);
    const generatedRecipes = useAppSelector((state: RootState) => state.app.generatedRecipes);
    const currentMeal = useAppSelector((state: RootState) => state.app.currentMeal);
    const startWithLast = useAppSelector((state: RootState) => state.app.startWithLastProducts);
    const lastProducts = useAppSelector((state: RootState) => state.app.lastDetectedProducts);

    useEffect(() => {
        if (isOpen && startWithLast && lastProducts.length > 0) {
            setDetectedItems(lastProducts);
            setSelectedItems(lastProducts);
            setCurrentStep(2); // Jump to product selection
        }
    }, [isOpen, startWithLast, lastProducts]);

    const handleClose = () => {
        dispatch(setAIPhotoModalOpen(false));
        setTimeout(() => {
            setFile(null);
            setPreview(null);
            setDetectedItems([]);
            setSelectedItems([]);
            setCurrentStep(0);
            if (preview) URL.revokeObjectURL(preview);
        }, 300);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const acceptedFile = acceptedFiles[0];
            setFile(acceptedFile);
            setPreview(URL.createObjectURL(acceptedFile));
            setCurrentStep(1);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [] },
        multiple: false,
    });

    const handleRemoveImage = () => {
        setFile(null);
        setPreview(null);
        setDetectedItems([]);
        setSelectedItems([]);
        setCurrentStep(0);
        if (preview) URL.revokeObjectURL(preview);
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsLoading(true);
        try {
            const data = await analyzePhoto(file, biomarkers, preferences);
            const detected = data.detected || [];
            setDetectedItems(detected);
            setSelectedItems(detected);
            setCurrentStep(2);
        } catch (error) {
            console.error("Failed to analyze photo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSelectedItem = (itemToToggle: string) => {
        setSelectedItems(prev =>
            prev.includes(itemToToggle)
                ? prev.filter(item => item !== itemToToggle)
                : [...prev, itemToToggle]
        );
    };

    const handleConfirmProducts = () => {
        dispatch(setLastDetectedProducts(selectedItems));
        setCurrentStep(3); // Move to difficulty selection
    }

    const handleGenerate = () => {
        dispatch(generateRecipe({ products: selectedItems, difficulty }));
        setCurrentStep(4); // Move to result
    }

    const handleAddToPlan = (recipe: PlanItem) => {
        if (currentMeal) {
            dispatch(setPlanItem({ meal: currentMeal, item: recipe, mode: 'diy' }));
            dispatch(setCurrentMeal(null)); // This will hide the generator section
            handleClose();
        }
    }

    const animationVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="w-full max-w-2xl p-2 sm:p-6">
                <div className="flex justify-between items-start mb-6 px-4">
                    {steps.map((step, index) => (
                        <div key={step} className="w-1/5 text-center relative">
                            <div className="relative inline-block">
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto", {
                                    "bg-indigo-600 text-white": currentStep === index,
                                    "bg-gray-200 text-gray-500": currentStep > index,
                                    "bg-white border-2 border-gray-200 text-gray-400": currentStep < index,
                                })}>{index + 1}</div>
                                {index < steps.length - 1 && <div className="absolute top-4 left-1/2 w-full h-px bg-gray-200 -z-10"></div>}
                            </div>
                             <p className={clsx("mt-2 font-semibold text-xs sm:text-sm", {
                                "text-gray-800": currentStep === index,
                                "text-gray-500": currentStep !== index,
                            })}>{step}</p>
                        </div>
                    ))}
                </div>

                <div className="min-h-[350px] flex flex-col justify-center items-center">
                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div key="initial" variants={animationVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
                                <div {...getRootProps()} className={clsx('border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors', {'border-indigo-500 bg-indigo-50': isDragActive, 'border-gray-300 hover:border-indigo-400': !isDragActive})}>
                                    <input {...getInputProps()} />
                                    <UploadCloud className="h-12 w-12 text-gray-400 mx-auto" />
                                    <p className="mt-4 font-semibold text-gray-700">Нажмите, чтобы загрузить, или перетащите фото</p>
                                    <p className="text-sm text-gray-500">PNG, JPG до 5МБ</p>
                                </div>
                            </motion.div>
                        )}
                         {currentStep === 1 && (
                            <motion.div key="preview" variants={animationVariants} initial="hidden" animate="visible" exit="exit" className="text-center w-full">
                                {preview && (
                                    <div className="relative inline-block">
                                        <img src={preview} alt="Предпросмотр" className="max-h-60 rounded-lg shadow-md" />
                                        <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"><Trash2 className="h-5 w-5" /></button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                         {currentStep === 2 && (
                            <motion.div key="results" variants={animationVariants} initial="hidden" animate="visible" exit="exit" className="text-center w-full flex flex-col items-center justify-center">
                                <h2 className="text-xl font-semibold">Распознанные продукты</h2>
                                <p className="text-gray-600 mt-2">Нажмите на продукт, чтобы исключить его из генерации.</p>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                                    {detectedItems.map((item) => (
                                        <button 
                                            key={item} 
                                            onClick={() => handleToggleSelectedItem(item)} 
                                            className={clsx(
                                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm border-2",
                                                {
                                                    "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 hover:border-indigo-300 transform hover:scale-105": selectedItems.includes(item),
                                                    "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200 line-through opacity-70": !selectedItems.includes(item),
                                                }
                                            )}
                                        >
                                            <span className="font-medium">{item}</span>
                                            {selectedItems.includes(item) ? <Check className="h-4 w-4 text-indigo-500" /> : <X className="h-4 w-4 text-gray-400" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                         {currentStep === 3 && (
                            <motion.div key="difficulty" variants={animationVariants} initial="hidden" animate="visible" exit="exit" className="text-center w-full">
                                <h2 className="text-xl font-semibold mb-4">Выберите сложность</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(difficultyOptions).map(([level, desc]) => (
                                        <button key={level} onClick={() => setDifficulty(level as any)} className={clsx("p-4 rounded-lg border-2 text-left transition-all", { "border-indigo-600 bg-indigo-50 scale-105": difficulty === level, "border-gray-200 hover:border-indigo-300": difficulty !== level })}>
                                            <h3 className="font-semibold text-lg text-center">{level.charAt(0).toUpperCase() + level.slice(1)}</h3>
                                            <p className="text-sm text-gray-500 mt-1 text-center">{desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {currentStep === 4 && (
                             <motion.div key="generating" variants={animationVariants} initial="hidden" animate="visible" exit="exit" className="text-center w-full">
                                {generationStatus === 'loading' && ( <div className="flex flex-col items-center gap-4"> <LoaderCircle className="h-12 w-12 animate-spin text-indigo-600" /> <h2 className="text-xl font-semibold">Создаем рецепт...</h2> <p className="text-gray-500">Это может занять до 30 секунд.</p> </div> )}
                                {generationStatus === 'succeeded' && generatedRecipes.length > 0 && (
                                     <div className="w-full">
                                         <h2 className="text-xl font-semibold mb-4">Ваши уникальные рецепты готовы!</h2>
                                         <div className="w-full max-h-[350px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                                            <div className="flex flex-col w-full gap-4 p-4" style={{ marginTop: '1rem', paddingBottom: '1.5rem' }}>
                                                {generatedRecipes.map((recipe, index) => (
                                                    <div key={index} className="w-full flex justify-center" style={{ padding: '0 1em 0 1em' }}>
                                                        <RecipeCard item={recipe} onAddToPlan={() => handleAddToPlan(recipe)} />
                                                    </div>
                                                ))}
                                            </div>
                                         </div>

                                     </div>
                                 )}
                                {generationStatus === 'failed' && ( <div className="text-red-500"> <h2 className="text-xl font-semibold">Ошибка генерации</h2> <p>Не удалось создать рецепт. Попробуйте изменить набор продуктов.</p> </div> )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="flex justify-center gap-3" style={{ marginTop: '1rem' }}>
                    <Button onClick={handleClose} variant="secondary">Отмена</Button>
                     {currentStep === 1 && <Button onClick={handleAnalyze} disabled={isLoading}>{isLoading && <LoaderCircle className="animate-spin mr-2" />} {isLoading ? 'Анализируем...' : 'Проанализировать'}</Button>}
                     {currentStep === 2 && <Button onClick={handleConfirmProducts} disabled={selectedItems.length === 0}>Далее</Button>}
                     {currentStep === 3 && <Button onClick={handleGenerate}>Сгенерировать</Button>}
                </div>
            </div>
        </Modal>
    );
};
