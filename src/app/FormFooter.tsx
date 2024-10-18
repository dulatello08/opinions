import { FaGithub } from 'react-icons/fa';

export default function FormFooter() {
    return (
        <footer className="bg-gray-800 py-6 mt-12">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-center md:text-left mb-4 md:mb-0">
                    &copy; 2024 UCHS Real Voice Survey. All rights reserved.
                </p>
                <div className="flex space-x-6">
                    <a
                        href="https://github.com/dulatello08"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white"
                    >
                        <FaGithub size={24} />
                    </a>
                </div>
            </div>
        </footer>
    );
}