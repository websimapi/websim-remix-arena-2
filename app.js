const { useState, useEffect, useRef } = React;

// --- Components ---

const Header = ({ vault }) => {
    const currency = vault?.col_1?.currency || 0;
    const gems = vault?.col_2?.gems || 0;

    return (
        <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-50 flex items-center justify-between px-4 shadow-lg">
            <div className="flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-blue-500 text-xl"></i>
                <h1 className="font-bold text-lg tracking-wider">REMIX<span className="text-blue-500">ARENA</span></h1>
            </div>
            
            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30">
                    <img src="coin.png" className="w-5 h-5 object-contain" />
                    <span className="font-mono text-yellow-400 font-bold">{currency}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-purple-500/30">
                    <img src="gem.png" className="w-5 h-5 object-contain" />
                    <span className="font-mono text-purple-400 font-bold">{gems}</span>
                </div>
            </div>
        </header>
    );
};

const ImageCard = ({ data, onRemix }) => {
    const isRemix = data.type === 'remix';
    
    return (
        <div className="image-card relative group rounded-xl overflow-hidden bg-gray-800 mb-4 border border-gray-700">
            <div className="relative aspect-square">
                <img src={data.imageUrl} alt={data.prompt} className="w-full h-full object-cover" />
                
                {isRemix && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-xs px-2 py-1 rounded shadow-lg font-bold">
                        REMIXED
                    </div>
                )}
            </div>
            
            <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <img src={data.authorAvatar} className="w-6 h-6 rounded-full border border-gray-500" />
                        <span className="text-xs text-gray-300 font-semibold truncate max-w-[100px]">{data.authorName}</span>
                    </div>
                    <button 
                        onClick={() => onRemix(data)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    >
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Remix
                    </button>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 italic">"{data.prompt}"</p>
            </div>
        </div>
    );
};

const GeneratorModal = ({ isOpen, onClose, type, sourceImage, onComplete }) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const finalPrompt = type === 'remix' 
                ? `Remix of existing image, ${prompt}` 
                : prompt;

            const options = {
                prompt: finalPrompt,
                aspect_ratio: "1:1"
            };

            // If remixing, we need to convert the source URL to base64 first or send it if supported.
            // Using standard imageGen. If remixing, we use image_inputs
            if (type === 'remix' && sourceImage) {
                 // Fetch blob to get base64 
                 const resp = await fetch(sourceImage.imageUrl);
                 const blob = await resp.blob();
                 const reader = new FileReader();
                 
                 await new Promise((resolve) => {
                     reader.onloadend = () => {
                        options.image_inputs = [{ url: reader.result }];
                        resolve();
                     };
                     reader.readAsDataURL(blob);
                 });
            }

            const result = await websim.imageGen(options);

            // Play sound
            const audio = new Audio(type === 'remix' ? 'sfx_earn.mp3' : 'sfx_shutter.mp3');
            audio.volume = 0.5;
            audio.play();

            onComplete(result.url, prompt);
            onClose();
            setPrompt("");
        } catch (err) {
            console.error(err);
            alert("Generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-600 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>

                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    {type === 'remix' ? <span className="text-purple-400">Remix Image</span> : <span className="text-blue-400">Generate New</span>}
                </h2>

                {type === 'remix' && sourceImage && (
                    <div className="mb-4 relative rounded-lg overflow-hidden h-32 w-full">
                        <img src={sourceImage.imageUrl} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/50 px-2 py-1 rounded text-xs">Source Image</span>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="loader mb-4"></div>
                        <p className="text-blue-400 animate-pulse">AI is dreaming...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm text-gray-400 mb-2">
                            {type === 'remix' ? "How should we change this?" : "What do you want to see?"}
                        </label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none h-24 mb-4"
                            placeholder={type === 'remix' ? "Make it cyberpunk, add rain..." : "A futuristic city in the clouds..."}
                            required
                        ></textarea>
                        
                        <button 
                            type="submit"
                            className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 ${
                                type === 'remix' 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500' 
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                            }`}
                        >
                            {type === 'remix' ? (
                                <><span>Remix for +5</span> <img src="gem.png" className="w-5 h-5"/></>
                            ) : (
                                <><span>Generate for +10</span> <img src="coin.png" className="w-5 h-5"/></>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- New Components ---

const BottomNav = ({ activeTab, onTabChange, onCreate }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 glass-panel z-50 flex items-center justify-around px-6 pb-safe border-t border-gray-700/50">
            <button 
                onClick={() => onTabChange('feed')}
                className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'feed' ? 'text-blue-400' : 'text-gray-500'}`}
            >
                <i className={`fa-solid fa-layer-group text-xl ${activeTab === 'feed' ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}></i>
                <span className="text-[10px] font-bold tracking-widest">FEED</span>
            </button>

            <button 
                onClick={onCreate}
                className="group relative flex items-center justify-center w-12 h-12 -mt-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full shadow-lg shadow-blue-900/50 border border-blue-400/50 text-white transform transition-all active:scale-95 hover:scale-110 hover:-translate-y-1"
            >
                <div className="absolute inset-0 rounded-full bg-blue-400 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <i className="fa-solid fa-plus text-xl relative z-10"></i>
            </button>

            <button 
                onClick={() => onTabChange('profile')}
                className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'profile' ? 'text-purple-400' : 'text-gray-500'}`}
            >
                <i className={`fa-solid fa-user-astronaut text-xl ${activeTab === 'profile' ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}`}></i>
                <span className="text-[10px] font-bold tracking-widest">ME</span>
            </button>
        </nav>
    );
};

const ProfileView = ({ vault, onRemix }) => {
    if (!vault) return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="loader mb-4 border-purple-500 border-b-transparent"></div>
            <p>Loading Profile...</p>
        </div>
    );

    const getProfileItems = () => {
        const username = vault.username;
        const avatar = `https://images.websim.com/avatar/${username}`;
        
        const gens = (vault.col_1?.generations || []).map(g => ({
            ...g,
            id: (g.id || Math.random().toString()) + '_p',
            type: 'generation',
            imageUrl: g.url,
            authorName: username,
            authorAvatar: avatar
        }));
        
        const remixes = (vault.col_2?.remixes || []).map(r => ({
            ...r,
            id: (r.id || Math.random().toString()) + '_p',
            type: 'remix',
            imageUrl: r.url,
            sourceUrl: r.source,
            authorName: username,
            authorAvatar: avatar
        }));
        
        return [...gens, ...remixes].sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const items = getProfileItems();

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col items-center py-8 bg-gradient-to-b from-gray-800/40 to-transparent mb-6 border-b border-gray-800/50">
                <div className="relative">
                    <img 
                        src={`https://images.websim.com/avatar/${vault.username}`} 
                        className="w-24 h-24 rounded-full border-4 border-gray-800 shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1.5 border border-gray-700">
                        <i className="fa-solid fa-certificate text-yellow-500"></i>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mt-4 tracking-wide">{vault.username}</h2>
                <div className="flex items-center gap-6 mt-4 text-xs font-mono">
                    <div className="flex flex-col items-center">
                        <span className="text-blue-400 font-bold text-lg">{vault.col_1?.generations?.length || 0}</span>
                        <span className="text-gray-500 uppercase tracking-widest">Gens</span>
                    </div>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-purple-400 font-bold text-lg">{vault.col_2?.remixes?.length || 0}</span>
                        <span className="text-gray-500 uppercase tracking-widest">Remixes</span>
                    </div>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="text-center text-gray-500 mt-12 px-8">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-regular fa-folder-open text-3xl opacity-50"></i>
                    </div>
                    <p className="text-lg font-medium text-gray-400">No creations yet</p>
                    <p className="text-sm mt-2 opacity-60">Tap the center + button to start your journey!</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="break-inside-avoid">
                            <ImageCard data={item} onRemix={onRemix} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main App ---

const App = () => {
    const [vault, setVault] = useState(null);
    const [feed, setFeed] = useState([]);
    const [currentView, setCurrentView] = useState('feed');
    const [isGenModalOpen, setIsGenModalOpen] = useState(false);
    const [remixTarget, setRemixTarget] = useState(null); // null or image object

    useEffect(() => {
        // Initialize User Data
        const init = async () => {
            await DataStore.getMyVault(); // Ensure vault exists
            
            // Subscribe to vault changes (currency/gems)
            DataStore.subscribeToMyVault((data) => {
                setVault(data);
            });

            // Subscribe to Public Feed
            DataStore.subscribeToFeed((records) => {
                setFeed(records);
            });
        };
        init();
    }, []);

    const handleGenerate = async (url, prompt) => {
        await DataStore.addGeneration(url, prompt);
        // Play earn sound
        new Audio('sfx_earn.mp3').play();
    };

    const handleRemixComplete = async (url, prompt) => {
        if (remixTarget) {
            await DataStore.addRemix(url, prompt, remixTarget.imageUrl);
             // Play earn sound
            new Audio('sfx_earn.mp3').play();
        }
    };

    const openRemix = (imageRecord) => {
        setRemixTarget(imageRecord);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            <Header vault={vault} />

            <main className="flex-1 overflow-y-auto feed-scroll pt-20 pb-24 px-4 max-w-2xl mx-auto w-full">
                {currentView === 'feed' ? (
                    feed.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20 animate-fade-in">
                            <i className="fa-solid fa-image text-4xl mb-4"></i>
                            <p>No images yet. Be the first to generate!</p>
                        </div>
                    ) : (
                        <div className="columns-1 sm:columns-2 gap-4 animate-fade-in">
                            {feed.map(item => (
                                <div key={item.id} className="break-inside-avoid">
                                    <ImageCard data={item} onRemix={openRemix} />
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <ProfileView vault={vault} onRemix={openRemix} />
                )}
            </main>

            <BottomNav 
                activeTab={currentView} 
                onTabChange={setCurrentView} 
                onCreate={() => setIsGenModalOpen(true)} 
            />

            {/* Modals */}
            <GeneratorModal 
                isOpen={isGenModalOpen} 
                onClose={() => setIsGenModalOpen(false)}
                type="generate"
                onComplete={handleGenerate}
            />

            <GeneratorModal 
                isOpen={!!remixTarget} 
                onClose={() => setRemixTarget(null)}
                type="remix"
                sourceImage={remixTarget}
                onComplete={handleRemixComplete}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);